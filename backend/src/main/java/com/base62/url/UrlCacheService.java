package com.base62.url;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class UrlCacheService {

    private static final Logger log = LoggerFactory.getLogger(UrlCacheService.class);
    private static final String CACHE_PREFIX = "base62:url:";
    private static final long CACHE_TTL_HOURS = 24;

    private final RedisTemplate<String, Object> redisTemplate;
    private final Map<String, UrlDtos.CachedUrlDto> localCache = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public UrlCacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public UrlDtos.CachedUrlDto get(String identifier) {
        if (identifier == null) return null;

        if (redisTemplate != null) {
            try {
                Object cached = redisTemplate.opsForValue().get(CACHE_PREFIX + identifier);
                if (cached instanceof UrlDtos.CachedUrlDto cachedUrl) {
                    return cachedUrl;
                }
            } catch (Exception ex) {
                log.warn("Redis cache read failed for identifier {}: {}", identifier, ex.getMessage());
            }
        }
        return localCache.get(identifier);
    }

    public void put(String identifier, UrlDtos.CachedUrlDto dto) {
        if (identifier == null || dto == null) return;

        localCache.put(identifier, dto);

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(CACHE_PREFIX + identifier, dto, CACHE_TTL_HOURS, TimeUnit.HOURS);
            } catch (Exception ex) {
                log.warn("Redis cache write failed for identifier {}: {}", identifier, ex.getMessage());
            }
        }
    }

    public void evict(String shortCode, String customAlias) {
        if (shortCode != null) {
            localCache.remove(shortCode);
            if (redisTemplate != null) {
                try {
                    redisTemplate.delete(CACHE_PREFIX + shortCode);
                } catch (Exception ignored) {}
            }
        }
        if (customAlias != null && !customAlias.isBlank()) {
            localCache.remove(customAlias);
            if (redisTemplate != null) {
                try {
                    redisTemplate.delete(CACHE_PREFIX + customAlias);
                } catch (Exception ignored) {}
            }
        }
    }
}
