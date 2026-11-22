package com.base62.url;

import com.base62.common.Base62Encoder;
import com.base62.common.QrCodeGenerator;
import com.base62.common.exception.BadRequestException;
import com.base62.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UrlService {

    private final UrlRepository urlRepository;
    private final Base62Encoder base62Encoder;
    private final QrCodeGenerator qrCodeGenerator;
    private final UrlCacheService urlCacheService;
    private final String baseUrl;

    public UrlService(UrlRepository urlRepository,
                      Base62Encoder base62Encoder,
                      QrCodeGenerator qrCodeGenerator,
                      UrlCacheService urlCacheService,
                      @Value("${base62.app.base-url}") String baseUrl) {
        this.urlRepository = urlRepository;
        this.base62Encoder = base62Encoder;
        this.qrCodeGenerator = qrCodeGenerator;
        this.urlCacheService = urlCacheService;
        this.baseUrl = baseUrl;
    }

    @Transactional
    public UrlDtos.UrlResponse createShortUrl(Long userId, UrlDtos.CreateUrlRequest request) {
        String cleanAlias = null;
        if (request.customAlias() != null && !request.customAlias().trim().isEmpty()) {
            cleanAlias = request.customAlias().trim();
            if (!base62Encoder.isValidAlias(cleanAlias)) {
                throw new BadRequestException("Custom alias must be 3-30 characters alphanumeric, underscore or hyphen.");
            }
            if (urlRepository.existsByCustomAlias(cleanAlias) || urlRepository.existsByShortCode(cleanAlias)) {
                throw new BadRequestException("Custom alias '" + cleanAlias + "' is already taken.");
            }
        }

        UrlEntity url = new UrlEntity();
        url.setUserId(userId);
        url.setOriginalUrl(request.originalUrl().trim());
        url.setCustomAlias(cleanAlias);
        url.setTitle(request.title() != null && !request.title().isBlank()
                ? request.title().trim()
                : extractDomainTitle(request.originalUrl()));
        url.setDescription(request.description());
        url.setExpiresAt(request.expiresAt());
        url.setActive(true);
        url.setShortCode("temp_" + System.nanoTime()); // temporary placeholder

        // 1. Save to acquire database ID
        url = urlRepository.save(url);

        // 2. Generate Base62 short code from the unique ID
        String shortCode = base62Encoder.encode(url.getId());
        url.setShortCode(shortCode);

        // 3. Generate QR code pointing to the redirect URL
        String targetRedirectUrl = baseUrl + "/r/" + (cleanAlias != null ? cleanAlias : shortCode);
        String qrCode = qrCodeGenerator.generateQrCodeBase64(targetRedirectUrl, 300, 300);
        url.setQrCodeDataUri(qrCode);

        UrlEntity saved = urlRepository.save(url);

        // 4. Cache in Redis
        UrlDtos.CachedUrlDto cachedDto = UrlDtos.CachedUrlDto.fromEntity(saved);
        urlCacheService.put(shortCode, cachedDto);
        if (cleanAlias != null) {
            urlCacheService.put(cleanAlias, cachedDto);
        }

        return UrlDtos.UrlResponse.fromEntity(saved, baseUrl);
    }

    @Transactional(readOnly = true)
    public Page<UrlDtos.UrlResponse> getUserUrls(Long userId, Pageable pageable) {
        return urlRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(entity -> UrlDtos.UrlResponse.fromEntity(entity, baseUrl));
    }

    @Transactional(readOnly = true)
    public UrlDtos.UrlResponse getUrl(Long id, Long userId) {
        UrlEntity entity = urlRepository.findById(id)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Link not found with id: " + id));
        return UrlDtos.UrlResponse.fromEntity(entity, baseUrl);
    }

    @Transactional
    public UrlDtos.UrlResponse updateUrl(Long id, Long userId, UrlDtos.UpdateUrlRequest request) {
        UrlEntity entity = urlRepository.findById(id)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Link not found with id: " + id));

        String oldAlias = entity.getCustomAlias();

        if (request.customAlias() != null && !request.customAlias().trim().equals(oldAlias)) {
            String newAlias = request.customAlias().trim();
            if (!newAlias.isEmpty()) {
                if (!base62Encoder.isValidAlias(newAlias)) {
                    throw new BadRequestException("Custom alias must be 3-30 characters alphanumeric, underscore or hyphen.");
                }
                if (urlRepository.existsByCustomAlias(newAlias) || urlRepository.existsByShortCode(newAlias)) {
                    throw new BadRequestException("Custom alias '" + newAlias + "' is already taken.");
                }
                entity.setCustomAlias(newAlias);
            } else {
                entity.setCustomAlias(null);
            }
        }

        if (request.originalUrl() != null && !request.originalUrl().isBlank()) {
            entity.setOriginalUrl(request.originalUrl().trim());
        }
        if (request.title() != null) {
            entity.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            entity.setDescription(request.description().trim());
        }
        if (request.isActive() != null) {
            entity.setActive(request.isActive());
        }
        if (request.expiresAt() != null) {
            entity.setExpiresAt(request.expiresAt());
        }
        entity.setUpdatedAt(Instant.now());

        UrlEntity saved = urlRepository.save(entity);

        // Update cache
        urlCacheService.evict(saved.getShortCode(), oldAlias);
        UrlDtos.CachedUrlDto cachedDto = UrlDtos.CachedUrlDto.fromEntity(saved);
        urlCacheService.put(saved.getShortCode(), cachedDto);
        if (saved.getCustomAlias() != null) {
            urlCacheService.put(saved.getCustomAlias(), cachedDto);
        }

        return UrlDtos.UrlResponse.fromEntity(saved, baseUrl);
    }

    @Transactional
    public void deleteUrl(Long id, Long userId) {
        UrlEntity entity = urlRepository.findById(id)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Link not found with id: " + id));

        urlCacheService.evict(entity.getShortCode(), entity.getCustomAlias());
        urlRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public UrlDtos.CachedUrlDto resolveForRedirect(String identifier) {
        // 1. Fast path: Redis cache lookup (sub-millisecond)
        UrlDtos.CachedUrlDto cached = urlCacheService.get(identifier);
        if (cached != null) {
            validateLinkStatus(cached);
            return cached;
        }

        // 2. Slow path: Database lookup and cache warming
        UrlEntity entity = urlRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL '" + identifier + "' does not exist."));

        UrlDtos.CachedUrlDto freshDto = UrlDtos.CachedUrlDto.fromEntity(entity);
        urlCacheService.put(freshDto.shortCode(), freshDto);
        if (freshDto.customAlias() != null) {
            urlCacheService.put(freshDto.customAlias(), freshDto);
        }

        validateLinkStatus(freshDto);
        return freshDto;
    }

    private void validateLinkStatus(UrlDtos.CachedUrlDto dto) {
        if (!dto.isActive()) {
            throw new BadRequestException("This link has been deactivated by its owner.");
        }
        if (dto.isExpired()) {
            throw new BadRequestException("This link has expired and is no longer accessible.");
        }
    }

    private String extractDomainTitle(String url) {
        try {
            java.net.URI uri = java.net.URI.create(url);
            String host = uri.getHost();
            return (host != null) ? host : "Shortened Link";
        } catch (Exception e) {
            return "Shortened Link";
        }
    }
}
