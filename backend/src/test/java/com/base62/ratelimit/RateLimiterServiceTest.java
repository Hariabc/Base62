package com.base62.ratelimit;

import com.base62.common.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimiterServiceTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        // null RedisTemplate forces resilient in-memory mode
        rateLimiterService = new RateLimiterService(null);
    }

    @Test
    @DisplayName("Should allow requests under the limit and decrement remaining")
    void testAllowRequestsUnderLimit() {
        String clientKey = "test_client_1";
        String group = "api";
        int limit = 10;

        RateLimiterService.RateLimitResult res1 = rateLimiterService.checkLimit(clientKey, group, limit);
        assertTrue(res1.allowed());
        assertEquals(limit, res1.limit());
        assertEquals(9, res1.remaining());

        RateLimiterService.RateLimitResult res2 = rateLimiterService.checkLimit(clientKey, group, limit);
        assertTrue(res2.allowed());
        assertEquals(8, res2.remaining());
    }

    @Test
    @DisplayName("Should reject and return 0 remaining when limit is exceeded")
    void testRejectWhenLimitExceeded() {
        String clientKey = "test_client_2";
        String group = "api";
        int limit = 3;

        rateLimiterService.checkLimit(clientKey, group, limit); // 1
        rateLimiterService.checkLimit(clientKey, group, limit); // 2
        rateLimiterService.checkLimit(clientKey, group, limit); // 3

        RateLimiterService.RateLimitResult resExceeded = rateLimiterService.checkLimit(clientKey, group, limit); // 4
        assertFalse(resExceeded.allowed());
        assertEquals(0, resExceeded.remaining());
        assertTrue(resExceeded.resetSeconds() > 0);
    }

    @Test
    @DisplayName("Enforce method should throw RateLimitExceededException when limit breached")
    void testEnforceThrowsException() {
        String clientKey = "test_client_3";
        String group = "login";
        int limit = 2;

        rateLimiterService.enforce(clientKey, group, limit); // 1
        rateLimiterService.enforce(clientKey, group, limit); // 2

        assertThrows(RateLimitExceededException.class, () -> {
            rateLimiterService.enforce(clientKey, group, limit); // 3 (exceeded)
        });
    }
}
