package com.base62.ai;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AiDtos {

    public record AiInsightsResponse(
            String summary,
            int engagementScore, // 0 to 100
            String trendDirection, // "GROWING", "DECLINING", "STEADY", "INSUFFICIENT_DATA"
            double changePercentage,
            List<String> keyFactors,
            List<String> recommendations,
            String optimalPostingWindow,
            String dominantAudience
    ) {}

    public record AiChatRequest(
            @NotBlank(message = "Question cannot be blank")
            String question,
            Long urlId
    ) {}

    public record AiChatResponse(
            String answer,
            List<String> suggestedFollowUps,
            AiInsightsResponse quickInsights
    ) {}
}
