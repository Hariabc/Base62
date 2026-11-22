package com.base62.analytics;

import com.base62.common.exception.ResourceNotFoundException;
import com.base62.url.UrlEntity;
import com.base62.url.UrlRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ClickEventRepository clickEventRepository;
    private final UrlRepository urlRepository;

    public AnalyticsService(ClickEventRepository clickEventRepository, UrlRepository urlRepository) {
        this.clickEventRepository = clickEventRepository;
        this.urlRepository = urlRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.AnalyticsOverviewResponse getUrlAnalytics(Long urlId, Long userId, int days) {
        UrlEntity url = urlRepository.findById(urlId)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Link not found with id: " + urlId));

        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<ClickEventEntity> events = clickEventRepository.findByUrlIdAndClickedAtAfterOrderByClickedAtAsc(urlId, since);

        return aggregateEvents(events, days, url.getClickCount());
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.AnalyticsOverviewResponse getUserOverallAnalytics(Long userId, int days) {
        List<UrlEntity> userUrls = urlRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        if (userUrls.isEmpty()) {
            return new AnalyticsDtos.AnalyticsOverviewResponse(0, 0.0, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }

        List<Long> urlIds = userUrls.stream().map(UrlEntity::getId).toList();
        long totalClicks = userUrls.stream().mapToLong(UrlEntity::getClickCount).sum();

        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<ClickEventEntity> events = clickEventRepository.findByUrlIdInAndClickedAtAfterOrderByClickedAtAsc(urlIds, since);

        return aggregateEvents(events, days, totalClicks);
    }

    private AnalyticsDtos.AnalyticsOverviewResponse aggregateEvents(List<ClickEventEntity> events, int days, long totalClicksCount) {
        if (events.isEmpty() && totalClicksCount == 0) {
            return new AnalyticsDtos.AnalyticsOverviewResponse(0, 0.0, generateEmptyTimeSeries(days), List.of(), List.of(), List.of(), List.of(), List.of());
        }

        long totalEvents = Math.max(events.size(), totalClicksCount);

        // 1. Time Series Daily Aggregation
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        Map<String, Long> dateCounts = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            dateCounts.put(d.format(formatter), 0L);
        }

        for (ClickEventEntity e : events) {
            String dateKey = e.getClickedAt().atZone(ZoneOffset.UTC).toLocalDate().format(formatter);
            dateCounts.computeIfPresent(dateKey, (k, v) -> v + 1);
        }

        List<AnalyticsDtos.TimeSeriesPoint> timeSeries = dateCounts.entrySet().stream()
                .map(entry -> new AnalyticsDtos.TimeSeriesPoint(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // Calculate weekly change percentage
        double weeklyChange = calculateWeeklyChange(events);

        // 2. Devices
        List<AnalyticsDtos.DistributionItem> devices = computeDistribution(
                events.stream().map(e -> e.getDeviceType() != null ? e.getDeviceType() : "Desktop").toList(),
                totalEvents
        );

        // 3. Browsers
        List<AnalyticsDtos.DistributionItem> browsers = computeDistribution(
                events.stream().map(e -> e.getBrowser() != null ? e.getBrowser() : "Other").toList(),
                totalEvents
        );

        // 4. Operating Systems
        List<AnalyticsDtos.DistributionItem> operatingSystems = computeDistribution(
                events.stream().map(e -> e.getOperatingSystem() != null ? e.getOperatingSystem() : "Other").toList(),
                totalEvents
        );

        // 5. Referrers
        List<AnalyticsDtos.DistributionItem> topReferrers = computeDistribution(
                events.stream().map(e -> e.getReferer() != null ? e.getReferer() : "Direct").toList(),
                totalEvents
        );

        // 6. Top Countries
        Map<String, Long> countryCounts = events.stream()
                .collect(Collectors.groupingBy(e -> e.getCountryCode() != null ? e.getCountryCode() : "US", Collectors.counting()));

        Map<String, String> countryNameMap = events.stream()
                .filter(e -> e.getCountryCode() != null)
                .collect(Collectors.toMap(ClickEventEntity::getCountryCode, ClickEventEntity::getCountryName, (a, b) -> a));

        List<AnalyticsDtos.CountryItem> topCountries = countryCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(entry -> {
                    String code = entry.getKey();
                    String name = countryNameMap.getOrDefault(code, "Unknown");
                    double pct = totalEvents > 0 ? Math.round((entry.getValue() * 100.0 / totalEvents) * 10.0) / 10.0 : 0.0;
                    return new AnalyticsDtos.CountryItem(code, name, entry.getValue(), pct);
                })
                .collect(Collectors.toList());

        return new AnalyticsDtos.AnalyticsOverviewResponse(
                totalEvents,
                weeklyChange,
                timeSeries,
                devices,
                browsers,
                operatingSystems,
                topReferrers,
                topCountries
        );
    }

    private List<AnalyticsDtos.DistributionItem> computeDistribution(List<String> items, long total) {
        if (items.isEmpty() || total == 0) return List.of();

        Map<String, Long> counts = items.stream()
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> {
                    double pct = Math.round((entry.getValue() * 100.0 / total) * 10.0) / 10.0;
                    return new AnalyticsDtos.DistributionItem(entry.getKey(), entry.getValue(), pct);
                })
                .collect(Collectors.toList());
    }

    private double calculateWeeklyChange(List<ClickEventEntity> events) {
        Instant now = Instant.now();
        Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
        Instant twoWeeksAgo = now.minus(14, ChronoUnit.DAYS);

        long thisWeekClicks = events.stream().filter(e -> e.getClickedAt().isAfter(oneWeekAgo)).count();
        long prevWeekClicks = events.stream().filter(e -> e.getClickedAt().isAfter(twoWeeksAgo) && e.getClickedAt().isBefore(oneWeekAgo)).count();

        if (prevWeekClicks == 0) {
            return thisWeekClicks > 0 ? 100.0 : 0.0;
        }
        return Math.round(((double) (thisWeekClicks - prevWeekClicks) / prevWeekClicks * 100.0) * 10.0) / 10.0;
    }

    private List<AnalyticsDtos.TimeSeriesPoint> generateEmptyTimeSeries(int days) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<AnalyticsDtos.TimeSeriesPoint> points = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            points.add(new AnalyticsDtos.TimeSeriesPoint(d.format(formatter), 0));
        }
        return points;
    }
}
