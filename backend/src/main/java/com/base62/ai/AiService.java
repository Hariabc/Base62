package com.base62.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.base62.analytics.AnalyticsDtos;
import com.base62.analytics.AnalyticsService;
import com.base62.url.UrlEntity;
import com.base62.url.UrlRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AnalyticsService analyticsService;
    private final UrlRepository urlRepository;
    private final SimulatedAiEngine simulatedAiEngine;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${base62.ai.api-key:mock}")
    private String apiKey;

    @Value("${base62.ai.provider:simulated}")
    private String provider;

    @Value("${base62.ai.model:gpt-4o-mini}")
    private String model;

    public AiService(AnalyticsService analyticsService,
                     UrlRepository urlRepository,
                     SimulatedAiEngine simulatedAiEngine) {
        this.analyticsService = analyticsService;
        this.urlRepository = urlRepository;
        this.simulatedAiEngine = simulatedAiEngine;
    }

    public AiDtos.AiInsightsResponse getInsightsForUrl(Long urlId, Long userId) {
        UrlEntity url = urlRepository.findById(urlId)
                .filter(u -> u.getUserId().equals(userId))
                .orElse(null);

        AnalyticsDtos.AnalyticsOverviewResponse analytics = analyticsService.getUrlAnalytics(urlId, userId, 7);
        String title = url != null ? url.getTitle() : "URL #" + urlId;

        // Try external LLM if real key is configured
        if (isRealApiKeyConfigured()) {
            try {
                String llmSummary = callLlmForSummary(analytics, title);
                if (llmSummary != null && !llmSummary.isBlank()) {
                    AiDtos.AiInsightsResponse fallback = simulatedAiEngine.generateInsights(analytics, title);
                    return new AiDtos.AiInsightsResponse(
                            llmSummary,
                            fallback.engagementScore(),
                            fallback.trendDirection(),
                            fallback.changePercentage(),
                            fallback.keyFactors(),
                            fallback.recommendations(),
                            fallback.optimalPostingWindow(),
                            fallback.dominantAudience()
                    );
                }
            } catch (Exception e) {
                log.warn("External LLM call failed, reverting to simulated AI engine: {}", e.getMessage());
            }
        }

        return simulatedAiEngine.generateInsights(analytics, title);
    }

    public AiDtos.AiInsightsResponse getOverallInsights(Long userId) {
        AnalyticsDtos.AnalyticsOverviewResponse analytics = analyticsService.getUserOverallAnalytics(userId, 7);
        return simulatedAiEngine.generateInsights(analytics, "Portfolio Overview");
    }

    public AiDtos.AiChatResponse chatWithAssistant(Long userId, AiDtos.AiChatRequest request) {
        AnalyticsDtos.AnalyticsOverviewResponse analytics;
        String linkTitle;

        if (request.urlId() != null) {
            analytics = analyticsService.getUrlAnalytics(request.urlId(), userId, 7);
            UrlEntity url = urlRepository.findById(request.urlId()).orElse(null);
            linkTitle = url != null ? url.getTitle() : "Selected URL";
        } else {
            analytics = analyticsService.getUserOverallAnalytics(userId, 7);
            linkTitle = "All Workspace Links";
        }

        // Check if external LLM configured
        if (isRealApiKeyConfigured()) {
            try {
                String llmReply = callLlmForChat(request.question(), analytics, linkTitle);
                if (llmReply != null && !llmReply.isBlank()) {
                    AiDtos.AiInsightsResponse quickInsights = simulatedAiEngine.generateInsights(analytics, linkTitle);
                    List<String> followUps = List.of(
                            "What are the top 3 traffic drivers?",
                            "How do I prevent click drop-offs?",
                            "Forecast clicks for next week"
                    );
                    return new AiDtos.AiChatResponse(llmReply, followUps, quickInsights);
                }
            } catch (Exception e) {
                log.warn("External LLM chat failed, using native engine: {}", e.getMessage());
            }
        }

        return simulatedAiEngine.answerQuestion(request.question(), analytics, linkTitle);
    }

    private boolean isRealApiKeyConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("mock") && !apiKey.startsWith("mock_");
    }

    private String callLlmForSummary(AnalyticsDtos.AnalyticsOverviewResponse analytics, String title) throws Exception {
        String prompt = "You are Base62 AI, an elite URL analytics intelligence engine. Summarize the following performance metrics in 2 concise sentences with actionable insights.\n" +
                "Link: " + title + "\n" +
                "Total Clicks: " + analytics.totalClicks() + "\n" +
                "Weekly Delta: " + analytics.weeklyChangePercentage() + "%\n" +
                "Top Device: " + (analytics.devices().isEmpty() ? "N/A" : analytics.devices().get(0).name()) + "\n" +
                "Top Referrer: " + (analytics.topReferrers().isEmpty() ? "Direct" : analytics.topReferrers().get(0).name());

        return callOpenAiApi(prompt);
    }

    private String callLlmForChat(String question, AnalyticsDtos.AnalyticsOverviewResponse analytics, String title) throws Exception {
        String prompt = "You are Base62 AI Assistant. The user asks: '" + question + "'.\n" +
                "Context: Link: " + title + ", Total Clicks: " + analytics.totalClicks() +
                ", Weekly Growth: " + analytics.weeklyChangePercentage() + "%.\n" +
                "Answer directly, professionally, and concisely in 2-3 short paragraphs.";

        return callOpenAiApi(prompt);
    }

    private String callOpenAiApi(String prompt) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are Base62 AI, a concise link performance advisor."),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.7,
                "max_tokens", 350
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(12))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            return root.path("choices").get(0).path("message").path("content").asText();
        }
        return null;
    }
}
