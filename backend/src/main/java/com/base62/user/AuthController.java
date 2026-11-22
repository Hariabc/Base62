package com.base62.user;

import com.base62.common.ApiResponse;
import com.base62.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & User Management", description = "Endpoints for JWT authentication, registration, user profiles, and API key management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account with default FREE tier and generated API key")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Account registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user and returns JWT bearer token")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Logged in successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile", description = "Fetches the authenticated user profile, tier, and API key")
    public ResponseEntity<ApiResponse<AuthDto.UserProfileDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        AuthDto.UserProfileDto profile = authService.getProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/regenerate-api-key")
    @Operation(summary = "Regenerate API key", description = "Rotates the user's secret API key")
    public ResponseEntity<ApiResponse<AuthDto.UserProfileDto>> regenerateApiKey(@AuthenticationPrincipal UserPrincipal principal) {
        AuthDto.UserProfileDto profile = authService.regenerateApiKey(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile, "API key regenerated successfully"));
    }

    @PostMapping("/tier")
    @Operation(summary = "Update tier", description = "Switch between FREE, PRO, and ENTERPRISE tiers")
    public ResponseEntity<ApiResponse<AuthDto.UserProfileDto>> updateTier(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AuthDto.UpdateTierRequest request) {
        AuthDto.UserProfileDto profile = authService.updateTier(principal.getId(), request.tier());
        return ResponseEntity.ok(ApiResponse.success(profile, "User tier upgraded to " + request.tier()));
    }
}
