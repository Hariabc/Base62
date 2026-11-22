package com.base62.ratelimit;

import com.base62.common.exception.RateLimitExceededException;
import com.base62.user.UserTier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Distributed Token-Bucket / Sliding Window Rate Limiter.
 * Employs Redis atomic increments with sliding 60-second windows.
 * Features graceful in-memory fallback for environments where Redis is initializing or offline.
 */
@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final Map<String, InMemoryCounter> inMemoryStore = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public RateLimiterService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public record RateLimitResult(boolean allowed, int limit, int remaining, long resetSeconds) {}

    public RateLimitResult checkLimit(String clientKey, String endpointGroup, int maxRequestsPerMinute) {
        String key = "ratelimit:" + endpointGroup + ":" + clientKey;

        // Try Redis first
        if (redisTemplate != null) {
            try {
                Long currentCount = redisTemplate.opsForValue().increment(key);
                if (currentCount != null) {
                    if (currentCount == 1) {
                        redisTemplate.expire(key, 60, TimeUnit.SECONDS);
                    }
                    Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                    long resetSeconds = (ttl != null && ttl > 0) ? ttl : 60;

                    if (currentCount > maxRequestsPerMinute) {
                        return new RateLimitResult(false, maxRequestsPerMinute, 0, resetSeconds);
                    }
                    int remaining = (int) Math.max(0, maxRequestsPerMinute - currentCount);
                    return new RateLimitResult(true, maxRequestsPerMinute, remaining, resetSeconds);
                }
            } catch (Exception ex) {
                log.warn("Redis rate limiter unavailable, falling back to resilient in-memory limiter: {}", ex.getMessage());
            }
        }

        // Resilient in-memory fallback
        InMemoryCounter counter = inMemoryStore.compute(key, (k, existing) -> {
            Instant now = Instant.now();
            if (existing == null || existing.expiresAt.isBefore(now)) {
                return new InMemoryCounter(new AtomicInteger(1), now.plusSeconds(60));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int current = counter.count.get();
        long resetSeconds = Math.max(1, Duration.between(Instant.now(), counter.expiresAt).getSeconds());

        if (current > maxRequestsPerMinute) {
            return new RateLimitResult(false, maxRequestsPerMinute, 0, resetSeconds);
        }

        int remaining = Math.max(0, maxRequestsPerMinute - current);
        return new RateLimitResult(true, maxRequestsPerMinute, remaining, resetSeconds);
    }

    public void enforce(String clientKey, String endpointGroup, int maxRequestsPerMinute) {
        RateLimitResult result = checkLimit(clientKey, endpointGroup, maxRequestsPerMinute);
        if (!result.allowed()) {
            throw new RateLimitExceededException(
                    "Rate limit of " + maxRequestsPerMinute + " requests/min exceeded for " + endpointGroup + ". Please try again in " + result.resetSeconds() + " seconds.",
                    result.resetSeconds()
            );
        }
    }

    public int getTierLimit(UserTier tier) {
        if (tier == null) return 20; // anonymous
        return switch (tier) {
            case PRO -> 1000;
            case ENTERPRISE -> 5000;
            default -> 100; // FREE
        };
    }

    private static class InMemoryCounter {
        final AtomicInteger count;
        final Instant expiresAt;

        InMemoryCounter(AtomicInteger count, Instant expiresAt) {
            this.count = count;
            this.expiresAt = expiresAt;
        }
    }
}
