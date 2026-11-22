package com.base62.url;

import com.base62.analytics.AnalyticsDtos;
import com.base62.common.QrCodeGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;

@RestController
@Tag(name = "Redirect & Resolution Engine", description = "Sub-millisecond redirection and QR code resolution")
public class RedirectController {

    private final UrlService urlService;
    private final ApplicationEventPublisher eventPublisher;
    private final QrCodeGenerator qrCodeGenerator;

    public RedirectController(UrlService urlService,
                              ApplicationEventPublisher eventPublisher,
                              QrCodeGenerator qrCodeGenerator) {
        this.urlService = urlService;
        this.eventPublisher = eventPublisher;
        this.qrCodeGenerator = qrCodeGenerator;
    }

    @GetMapping("/r/{identifier}")
    @Operation(summary = "Redirect to destination", description = "Resolves short code or alias via cache and returns HTTP 302 Found redirect")
    public ResponseEntity<Void> redirect(
            @PathVariable String identifier,
            HttpServletRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(value = "Referer", required = false) String referer,
            @RequestHeader(value = "CF-IPCountry", required = false) String cdnCountry) {

        // 1. High-speed lookup (Redis cached)
        UrlDtos.CachedUrlDto urlDto = urlService.resolveForRedirect(identifier);

        // 2. Publish async analytics event (non-blocking)
        String clientIp = getClientIp(request);
        AnalyticsDtos.ClickEventMessage clickEvent = new AnalyticsDtos.ClickEventMessage(
                urlDto.id(),
                clientIp,
                userAgent,
                referer,
                cdnCountry,
                Instant.now()
        );
        eventPublisher.publishEvent(clickEvent);

        // 3. Return HTTP 302 redirect
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(urlDto.originalUrl()))
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, max-age=0, must-revalidate")
                .build();
    }

    @GetMapping(value = "/qr/{identifier}", produces = MediaType.IMAGE_PNG_VALUE)
    @Operation(summary = "Get raw QR code PNG image", description = "Generates and streams PNG QR code image directly")
    public ResponseEntity<byte[]> getQrCode(
            @PathVariable String identifier,
            @RequestParam(defaultValue = "300") int size,
            HttpServletRequest request) {
        UrlDtos.CachedUrlDto urlDto = urlService.resolveForRedirect(identifier);
        String redirectUrl = request.getScheme() + "://" + request.getServerName() +
                (request.getServerPort() == 80 || request.getServerPort() == 443 ? "" : ":" + request.getServerPort()) +
                "/r/" + identifier;

        byte[] qrBytes = qrCodeGenerator.generateQrCodeBytes(redirectUrl, size, size);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(qrBytes);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return (ip != null) ? ip : "127.0.0.1";
    }
}
