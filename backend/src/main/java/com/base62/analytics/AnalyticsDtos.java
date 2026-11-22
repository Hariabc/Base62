package com.base62.analytics;

import java.time.Instant;
import java.util.List;

public class AnalyticsDtos {

    public record ClickEventMessage(
            Long urlId,
            String ipAddress,
            String userAgent,
            String referer,
            String cdnCountry,
            Instant timestamp
    ) {}

    public record TimeSeriesPoint(
            String date,
            long clicks
    ) {}

    public record DistributionItem(
            String name,
            long count,
            double percentage
    ) {}

    public record CountryItem(
            String countryCode,
            String countryName,
            long count,
            double percentage
    ) {}

    public record AnalyticsOverviewResponse(
            long totalClicks,
            double weeklyChangePercentage,
            List<TimeSeriesPoint> timeSeries,
            List<DistributionItem> devices,
            List<DistributionItem> browsers,
            List<DistributionItem> operatingSystems,
            List<DistributionItem> topReferrers,
            List<CountryItem> topCountries
    ) {}
}
