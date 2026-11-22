package com.base62.url;

import com.base62.common.ApiResponse;
import com.base62.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/urls")
@Tag(name = "URL Management", description = "Endpoints for creating, managing, and inspecting shortened URLs")
public class UrlController {

    private final UrlService urlService;

    public UrlController(UrlService urlService) {
        this.urlService = urlService;
    }

    @PostMapping
    @Operation(summary = "Create shortened URL", description = "Generates a Base62 short URL and QR code for an original destination URL")
    public ResponseEntity<ApiResponse<UrlDtos.UrlResponse>> createUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UrlDtos.CreateUrlRequest request) {
        UrlDtos.UrlResponse response = urlService.createShortUrl(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Short URL generated successfully"));
    }

    @GetMapping
    @Operation(summary = "List user URLs", description = "Retrieves paginated list of shortened URLs for authenticated user")
    public ResponseEntity<ApiResponse<Page<UrlDtos.UrlResponse>>> getUserUrls(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UrlDtos.UrlResponse> result = urlService.getUserUrls(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get URL details", description = "Retrieves details for a specific shortened URL")
    public ResponseEntity<ApiResponse<UrlDtos.UrlResponse>> getUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        UrlDtos.UrlResponse response = urlService.getUrl(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update shortened URL", description = "Updates original URL, alias, title, description, or active status")
    public ResponseEntity<ApiResponse<UrlDtos.UrlResponse>> updateUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UrlDtos.UpdateUrlRequest request) {
        UrlDtos.UrlResponse response = urlService.updateUrl(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "URL updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete shortened URL", description = "Deactivates and deletes the shortened URL and evicts from cache")
    public ResponseEntity<ApiResponse<Void>> deleteUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        urlService.deleteUrl(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "URL deleted successfully"));
    }
}
