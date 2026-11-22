package com.base62.analytics;

import com.base62.url.UrlRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AsyncAnalyticsListener {

    private static final Logger log = LoggerFactory.getLogger(AsyncAnalyticsListener.class);

    private final ClickEventRepository clickEventRepository;
    private final UrlRepository urlRepository;
    private final UserAgentParser userAgentParser;
    private final GeoIpService geoIpService;

    public AsyncAnalyticsListener(ClickEventRepository clickEventRepository,
                                  UrlRepository urlRepository,
                                  UserAgentParser userAgentParser,
                                  GeoIpService geoIpService) {
        this.clickEventRepository = clickEventRepository;
        this.urlRepository = urlRepository;
        this.userAgentParser = userAgentParser;
        this.geoIpService = geoIpService;
    }

    @Async
    @EventListener
    @Transactional
    public void handleClickEvent(AnalyticsDtos.ClickEventMessage event) {
        try {
            UserAgentParser.ClientDeviceInfo deviceInfo = userAgentParser.parse(event.userAgent());
            GeoIpService.GeoLocation geoLocation = geoIpService.resolve(event.ipAddress(), event.cdnCountry());

            ClickEventEntity entity = new ClickEventEntity();
            entity.setUrlId(event.urlId());
            entity.setClickedAt(event.timestamp() != null ? event.timestamp() : java.time.Instant.now());
            entity.setIpAddress(event.ipAddress());
            entity.setCountryCode(geoLocation.countryCode());
            entity.setCountryName(geoLocation.countryName());
            entity.setCity(geoLocation.city());
            entity.setBrowser(deviceInfo.browser());
            entity.setOperatingSystem(deviceInfo.operatingSystem());
            entity.setDeviceType(deviceInfo.deviceType());
            entity.setReferer(cleanReferer(event.referer()));

            clickEventRepository.save(entity);
            urlRepository.incrementClickCount(event.urlId(), java.time.Instant.now());

            log.debug("Recorded click event for URL id {} from {} ({})", event.urlId(), geoLocation.countryName(), deviceInfo.deviceType());
        } catch (Exception ex) {
            log.error("Failed to process async click event for URL id {}: {}", event.urlId(), ex.getMessage());
        }
    }

    private String cleanReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return "Direct / Unknown";
        }
        try {
            java.net.URI uri = java.net.URI.create(referer);
            String host = uri.getHost();
            return (host != null) ? host : referer;
        } catch (Exception e) {
            return referer;
        }
    }
}
