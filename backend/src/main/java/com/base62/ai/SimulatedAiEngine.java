package com.base62.ai;

import com.base62.analytics.AnalyticsDtos;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class SimulatedAiEngine {

    public AiDtos.AiInsightsResponse generateInsights(AnalyticsDtos.AnalyticsOverviewResponse analytics, String linkTitle) {
        long totalClicks = analytics.totalClicks();
        double change = analytics.weeklyChangePercentage();

        String trend;
        if (totalClicks < 5) {
            trend = "NEW_LINK";
        } else if (change > 15) {
            trend = "RAPID_GROWTH";
        } else if (change > 0) {
            trend = "STEADY_GROWTH";
        } else if (change < -10) {
            trend = "DECLINING";
        } else {
            trend = "STABLE";
        }

        // Score 0-100
        int score = (int) Math.min(98, Math.max(35, 50 + (change * 0.5) + Math.min(25, totalClicks * 0.1)));

        List<String> keyFactors = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // Device factor
        if (!analytics.devices().isEmpty()) {
            AnalyticsDtos.DistributionItem topDevice = analytics.devices().get(0);
            keyFactors.add(topDevice.name() + " represents " + topDevice.percentage() + "% of all click traffic.");
            if ("Mobile".equalsIgnoreCase(topDevice.name()) && topDevice.percentage() > 50) {
                recommendations.add("Prioritize mobile responsive landing page speed; more than half your audience visits via smartphone.");
            }
        }

        // Referrer factor
        if (!analytics.topReferrers().isEmpty()) {
            AnalyticsDtos.DistributionItem topRef = analytics.topReferrers().get(0);
            keyFactors.add("Primary conversion source: " + topRef.name() + " (" + topRef.percentage() + "%).");
            if (analytics.topReferrers().size() <= 2) {
                recommendations.add("Diversify traffic channels across Twitter/X, LinkedIn newsletters, and developer communities.");
            }
        }

        // Geography factor
        String dominantGeo = "Global";
        if (!analytics.topCountries().isEmpty()) {
            AnalyticsDtos.CountryItem topCountry = analytics.topCountries().get(0);
            dominantGeo = topCountry.countryName() + " (" + topCountry.countryCode() + ")";
            keyFactors.add("Top geographical region: " + topCountry.countryName() + " (" + topCountry.percentage() + "%).");
        }

        // Trend factor & recommendations
        if (change < 0) {
            keyFactors.add("Traffic contracted by " + Math.abs(change) + "% compared to the prior 7-day period.");
            recommendations.add("Re-engage social channels with fresh hooks or schedule follow-up promotional posts.");
        } else if (change > 0) {
            keyFactors.add("Momentum is positive with a +" + change + "% click surge this week.");
            recommendations.add("Double down on the top performing referral channels while engagement is peaking.");
        }

        recommendations.add("Attach UTM tags (utm_source, utm_medium) to identify specific campaign conversions.");

        String summary = String.format(
                "Link '%s' recorded %d total clicks with a %s%.1f%% 7-day trajectory. %s Audience is primarily based in %s.",
                linkTitle != null ? linkTitle : "Campaign Link",
                totalClicks,
                change >= 0 ? "+" : "",
                change,
                keyFactors.isEmpty() ? "" : keyFactors.get(0),
                dominantGeo
        );

        return new AiDtos.AiInsightsResponse(
                summary,
                score,
                trend,
                change,
                keyFactors,
                recommendations,
                "Tuesday & Thursday 14:00 - 18:00 UTC",
                dominantGeo
        );
    }

    public AiDtos.AiChatResponse answerQuestion(String question, AnalyticsDtos.AnalyticsOverviewResponse analytics, String linkTitle) {
        String q = question.toLowerCase(Locale.ROOT);
        AiDtos.AiInsightsResponse insights = generateInsights(analytics, linkTitle);

        String answer;
        List<String> followUps = new ArrayList<>();

        if (q.contains("decrease") || q.contains("drop") || q.contains("down") || q.contains("why")) {
            if (analytics.weeklyChangePercentage() < 0) {
                answer = String.format(
                        "Your traffic decreased by %.1f%% compared to last week. %s " +
                        "A common reason for this drop is diminished social feed visibility or a weekend lull. " +
                        "Recommended fix: Republish key highlights on your top channel (%s) and ensure mobile landing pages load in under 2 seconds.",
                        Math.abs(analytics.weeklyChangePercentage()),
                        !analytics.devices().isEmpty() ? "Noticeably, " + analytics.devices().get(0).name() + " visitors shifted." : "",
                        !analytics.topReferrers().isEmpty() ? analytics.topReferrers().get(0).name() : "social media"
                );
            } else {
                answer = String.format(
                        "Actually, your traffic has not dropped! It is currently up by +%.1f%% over the previous 7 days with %d total clicks. You are experiencing positive growth.",
                        analytics.weeklyChangePercentage(),
                        analytics.totalClicks()
                );
            }
            followUps.add("How can I improve mobile conversions?");
            followUps.add("What is the best time of day to share this link?");
            followUps.add("Can you forecast next week's clicks?");
        } else if (q.contains("improve") || q.contains("grow") || q.contains("more clicks") || q.contains("recommend")) {
            answer = String.format(
                    "Here are 3 high-impact strategies to boost clicks on '%s':\n\n" +
                    "1. **Channel Retargeting**: Your highest converting source is **%s**. Focus your next promotional push there.\n" +
                    "2. **Optimal Timing**: Share during peak activity window: **%s**.\n" +
                    "3. **Custom Alias**: Using a descriptive, branded custom alias increases click-through rates by up to 34%% compared to generic codes.",
                    linkTitle != null ? linkTitle : "your link",
                    !analytics.topReferrers().isEmpty() ? analytics.topReferrers().get(0).name() : "Direct",
                    insights.optimalPostingWindow()
            );
            followUps.add("What are my top countries?");
            followUps.add("Show device breakdown");
            followUps.add("How does custom alias affect SEO?");
        } else if (q.contains("forecast") || q.contains("predict") || q.contains("next week")) {
            long current = analytics.totalClicks();
            double growth = (100.0 + analytics.weeklyChangePercentage()) / 100.0;
            long projected = Math.max(current + 5, (long) (current * Math.min(1.5, Math.max(0.8, growth))));
            answer = String.format(
                    "Based on your current 7-day run rate and growth velocity (%.1f%%), our predictive model forecasts approximately **%d to %d clicks** over the upcoming week. Sustained posting during peak hours will push you toward the high estimate.",
                    analytics.weeklyChangePercentage(),
                    Math.max(1, projected - 15),
                    projected + 25
            );
            followUps.add("Why did traffic drop this week?");
            followUps.add("What are the recommended actions?");
        } else if (q.contains("device") || q.contains("mobile") || q.contains("browser")) {
            answer = String.format(
                    "Your device breakdown shows that %s of your traffic comes from **%s**. Ensuring your destination page is responsive, lightweight, and frictionless for this audience will immediately protect your conversion rates.",
                    !analytics.devices().isEmpty() ? analytics.devices().get(0).percentage() + "%" : "majority",
                    !analytics.devices().isEmpty() ? analytics.devices().get(0).name() : "Desktop/Mobile"
            );
            followUps.add("How can I improve mobile landing speed?");
            followUps.add("What countries are clicking?");
        } else {
            answer = String.format(
                    "Base62 AI Analysis for '%s':\n\n" +
                    "• Total Volume: **%d clicks**\n" +
                    "• 7-Day Trend: **%s%.1f%%**\n" +
                    "• Engagement Health Score: **%d / 100**\n" +
                    "• Dominant Audience: **%s**\n\n" +
                    "Feel free to ask me about traffic trends, device optimizations, or click forecasts!",
                    linkTitle != null ? linkTitle : "Your URL",
                    analytics.totalClicks(),
                    analytics.weeklyChangePercentage() >= 0 ? "+" : "",
                    analytics.weeklyChangePercentage(),
                    insights.engagementScore(),
                    insights.dominantAudience()
            );
            followUps.add("Why did my traffic change?");
            followUps.add("How to optimize my link CTR?");
            followUps.add("Forecast next week's clicks");
        }

        return new AiDtos.AiChatResponse(answer, followUps, insights);
    }
}
