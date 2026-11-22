package com.base62.analytics;

import com.base62.common.ApiResponse;
import com.base62.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics & Click Intelligence", description = "High-throughput time-series analytics, device breakdown, and geo distribution")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get overall user link analytics", description = "Aggregated click metrics across all user links")
    public ResponseEntity<ApiResponse<AnalyticsDtos.AnalyticsOverviewResponse>> getOverallAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "7") int days) {
        AnalyticsDtos.AnalyticsOverviewResponse data = analyticsService.getUserOverallAnalytics(principal.getId(), days);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/url/{urlId}")
    @Operation(summary = "Get specific link analytics", description = "Granular click metrics for a single shortened URL")
    public ResponseEntity<ApiResponse<AnalyticsDtos.AnalyticsOverviewResponse>> getUrlAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long urlId,
            @RequestParam(defaultValue = "7") int days) {
        AnalyticsDtos.AnalyticsOverviewResponse data = analyticsService.getUrlAnalytics(urlId, principal.getId(), days);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
