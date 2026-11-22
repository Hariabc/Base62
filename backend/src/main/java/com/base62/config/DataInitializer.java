package com.base62.config;

import com.base62.analytics.ClickEventEntity;
import com.base62.analytics.ClickEventRepository;
import com.base62.common.Base62Encoder;
import com.base62.common.QrCodeGenerator;
import com.base62.url.UrlCacheService;
import com.base62.url.UrlDtos;
import com.base62.url.UrlEntity;
import com.base62.url.UrlRepository;
import com.base62.user.UserEntity;
import com.base62.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final UrlRepository urlRepository;
    private final ClickEventRepository clickEventRepository;
    private final Base62Encoder base62Encoder;
    private final QrCodeGenerator qrCodeGenerator;
    private final UrlCacheService urlCacheService;
    private final String baseUrl;

    public DataInitializer(UserRepository userRepository,
                           UrlRepository urlRepository,
                           ClickEventRepository clickEventRepository,
                           Base62Encoder base62Encoder,
                           QrCodeGenerator qrCodeGenerator,
                           UrlCacheService urlCacheService,
                           @Value("${base62.app.base-url}") String baseUrl) {
        this.userRepository = userRepository;
        this.urlRepository = urlRepository;
        this.clickEventRepository = clickEventRepository;
        this.base62Encoder = base62Encoder;
        this.qrCodeGenerator = qrCodeGenerator;
        this.urlCacheService = urlCacheService;
        this.baseUrl = baseUrl;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (urlRepository.count() > 0) {
            return;
        }

        UserEntity demoUser = userRepository.findByEmail("demo@base62.ai").orElse(null);
        if (demoUser == null) {
            return;
        }

        log.info("Seeding initial showcase URLs and analytics data for base62 AI...");

        createSeedLink(demoUser.getId(), "https://example.com/products/software/development/course?id=12345",
                "course", "Full-Stack Software Architecture Course", "Comprehensive curriculum on distributed systems & Spring Boot", 185);

        createSeedLink(demoUser.getId(), "https://github.com/spring-projects/spring-boot",
                "spring-repo", "Spring Boot GitHub Repository", "Source code and release notes for Spring Framework", 342);

        createSeedLink(demoUser.getId(), "https://news.ycombinator.com",
                "hn", "Hacker News Frontpage", "Top technology discussions and startup launches", 94);

        createSeedLink(demoUser.getId(), "https://aws.amazon.com/ecs",
                "aws-ecs", "AWS ECS Container Deployment Docs", "Official architectural blueprints for Fargate containers", 67);

        log.info("Showcase links and sample analytics seeded successfully!");
    }

    private void createSeedLink(Long userId, String originalUrl, String alias, String title, String desc, int clickCount) {
        UrlEntity url = new UrlEntity();
        url.setUserId(userId);
        url.setOriginalUrl(originalUrl);
        url.setCustomAlias(alias);
        url.setTitle(title);
        url.setDescription(desc);
        url.setActive(true);
        url.setShortCode("tmp_" + System.nanoTime());
        url = urlRepository.save(url);

        String shortCode = base62Encoder.encode(url.getId());
        url.setShortCode(shortCode);

        String redirectUrl = baseUrl + "/r/" + (alias != null ? alias : shortCode);
        String qr = qrCodeGenerator.generateQrCodeBase64(redirectUrl, 280, 280);
        url.setQrCodeDataUri(qr);
        url.setClickCount(clickCount);

        UrlEntity saved = urlRepository.save(url);

        // Warm cache
        UrlDtos.CachedUrlDto cachedDto = UrlDtos.CachedUrlDto.fromEntity(saved);
        urlCacheService.put(shortCode, cachedDto);
        if (alias != null) {
            urlCacheService.put(alias, cachedDto);
        }

        // Seed click events over the past 14 days
        seedClicksForLink(saved.getId(), clickCount);
    }

    private void seedClicksForLink(Long urlId, int count) {
        Random rand = new Random(urlId);
        List<String> devices = List.of("Desktop", "Mobile", "Mobile", "Tablet");
        List<String> browsers = List.of("Chrome", "Chrome", "Safari", "Edge", "Firefox");
        List<String> osList = List.of("Windows", "macOS", "iOS", "Android", "Linux");
        List<String> referrers = List.of("https://twitter.com", "https://linkedin.com", "https://github.com", "Direct / Unknown", "https://news.ycombinator.com");
        List<String[]> countries = List.of(
                new String[]{"US", "United States", "San Francisco"},
                new String[]{"IN", "India", "Bengaluru"},
                new String[]{"GB", "United Kingdom", "London"},
                new String[]{"DE", "Germany", "Berlin"},
                new String[]{"CA", "Canada", "Toronto"}
        );

        Instant now = Instant.now();
        for (int i = 0; i < count; i++) {
            // Random days in the past 14 days
            int hoursAgo = rand.nextInt(14 * 24);
            Instant clickTime = now.minus(hoursAgo, ChronoUnit.HOURS);

            String device = devices.get(rand.nextInt(devices.size()));
            String browser = browsers.get(rand.nextInt(browsers.size()));
            String os = osList.get(rand.nextInt(osList.size()));
            String referrer = referrers.get(rand.nextInt(referrers.size()));
            String[] country = countries.get(rand.nextInt(countries.size()));

            ClickEventEntity event = new ClickEventEntity();
            event.setUrlId(urlId);
            event.setClickedAt(clickTime);
            event.setIpAddress("192.168.1." + (rand.nextInt(200) + 1));
            event.setCountryCode(country[0]);
            event.setCountryName(country[1]);
            event.setCity(country[2]);
            event.setBrowser(browser);
            event.setOperatingSystem(os);
            event.setDeviceType(device);
            event.setReferer(referrer);

            clickEventRepository.save(event);
        }
    }
}
