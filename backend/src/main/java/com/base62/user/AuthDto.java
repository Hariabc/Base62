package com.base62.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class AuthDto {

    public record RegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            String fullName
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record AuthResponse(
            String token,
            String tokenType,
            Long userId,
            String email,
            String fullName,
            UserRole role,
            UserTier tier,
            String apiKey
    ) {
        public static AuthResponse of(String token, UserEntity user) {
            return new AuthResponse(
                    token,
                    "Bearer",
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole(),
                    user.getTier(),
                    user.getApiKey()
            );
        }
    }

    public record UserProfileDto(
            Long id,
            String email,
            String fullName,
            UserRole role,
            UserTier tier,
            String apiKey,
            int rateLimitPerMinute,
            Instant createdAt
    ) {
        public static UserProfileDto fromEntity(UserEntity user) {
            return new UserProfileDto(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole(),
                    user.getTier(),
                    user.getApiKey(),
                    user.getTier().getRequestsPerMinute(),
                    user.getCreatedAt()
            );
        }
    }

    public record UpdateTierRequest(
            UserTier tier
    ) {}
}
