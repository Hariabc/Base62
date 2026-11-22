package com.base62.url;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

import java.io.Serializable;
import java.time.Instant;

public class UrlDtos {

    public record CreateUrlRequest(
            @NotBlank(message = "Original URL cannot be blank")
            @URL(message = "Original URL must be a valid HTTP or HTTPS address")
            String originalUrl,

            String customAlias,
            String title,
            String description,
            Instant expiresAt
    ) {}

    public record UpdateUrlRequest(
            String originalUrl,
            String customAlias,
            String title,
            String description,
            Boolean isActive,
            Instant expiresAt
    ) {}

    public record UrlResponse(
            Long id,
            Long userId,
            String originalUrl,
            String shortCode,
            String customAlias,
            String shortUrl,
            String title,
            String description,
            String qrCodeDataUri,
            boolean isActive,
            boolean isExpired,
            Instant expiresAt,
            long clickCount,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static UrlResponse fromEntity(UrlEntity entity, String baseUrl) {
            String identifier = entity.getCustomAlias() != null && !entity.getCustomAlias().isBlank()
                    ? entity.getCustomAlias()
                    : entity.getShortCode();
            String shortUrl = baseUrl + "/r/" + identifier;

            return new UrlResponse(
                    entity.getId(),
                    entity.getUserId(),
                    entity.getOriginalUrl(),
                    entity.getShortCode(),
                    entity.getCustomAlias(),
                    shortUrl,
                    entity.getTitle(),
                    entity.getDescription(),
                    entity.getQrCodeDataUri(),
                    entity.isActive(),
                    entity.isExpired(),
                    entity.getExpiresAt(),
                    entity.getClickCount(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        }
    }

    public record CachedUrlDto(
            Long id,
            Long userId,
            String originalUrl,
            String shortCode,
            String customAlias,
            boolean isActive,
            Instant expiresAt
    ) implements Serializable {
        public static CachedUrlDto fromEntity(UrlEntity entity) {
            return new CachedUrlDto(
                    entity.getId(),
                    entity.getUserId(),
                    entity.getOriginalUrl(),
                    entity.getShortCode(),
                    entity.getCustomAlias(),
                    entity.isActive(),
                    entity.getExpiresAt()
            );
        }

        public boolean isExpired() {
            return expiresAt != null && expiresAt.isBefore(Instant.now());
        }
    }
}
