package com.base62.ai;

import com.base62.common.ApiResponse;
import com.base62.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Link Assistant & Diagnostics", description = "AI-powered performance analysis, traffic anomaly explanations, and conversational analytics chatbot")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/insights/url/{urlId}")
    @Operation(summary = "Get AI insights for a specific link", description = "Generates actionable performance diagnostics, engagement health score, and posting recommendations")
    public ResponseEntity<ApiResponse<AiDtos.AiInsightsResponse>> getUrlInsights(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long urlId) {
        AiDtos.AiInsightsResponse insights = aiService.getInsightsForUrl(urlId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(insights));
    }

    @GetMapping("/insights/overview")
    @Operation(summary = "Get AI insights for entire link portfolio", description = "High-level strategic audit across all created URLs")
    public ResponseEntity<ApiResponse<AiDtos.AiInsightsResponse>> getOverallInsights(
            @AuthenticationPrincipal UserPrincipal principal) {
        AiDtos.AiInsightsResponse insights = aiService.getOverallInsights(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(insights));
    }

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI Analytics Assistant", description = "Ask natural-language questions regarding traffic shifts, forecasts, and conversion optimization")
    public ResponseEntity<ApiResponse<AiDtos.AiChatResponse>> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiDtos.AiChatRequest request) {
        AiDtos.AiChatResponse response = aiService.chatWithAssistant(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
