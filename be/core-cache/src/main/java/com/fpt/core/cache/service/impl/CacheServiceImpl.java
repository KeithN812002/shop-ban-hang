package com.fpt.core.cache.service.impl;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

import com.fpt.core.cache.config.RedisProperties;
import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.constant.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheServiceImpl implements CacheService {

    private static final int SCAN_BATCH_SIZE = 500;

    private final RedisTemplate<String, Object> template;
    private final StringRedisTemplate strTemplate;
    private final RedisProperties redisProperties;

    @Override
    public void setString(String key, String value, Integer expire) {
        log.info("Starting set cache string, key={}", key);
        if (key == null || key.trim().isEmpty() || value == null) {
            return;
        }
        try {
            String nonNullKey = Objects.requireNonNull(key, "Key must not be null");
            String nonNullValue = Objects.requireNonNull(value, "Value must not be null");
            strTemplate.opsForValue().set(nonNullKey, nonNullValue);
            setTimeout(nonNullKey, expire);
            log.info("Completed set cache string, key={}", nonNullKey);
        } catch (Exception e) {
            log.error("Failed to set cache string, key={}", key, e);
            throw new IllegalStateException("errors.cache.set.failed", e);
        }
    }

    @Override
    public String getString(String key) {
        log.info("Starting get cache string, key={}", key);
        if (key == null || key.trim().isEmpty()) {
            return null;
        }
        try {
            String nonNullKey = Objects.requireNonNull(key, "Key must not be null");
            String result = strTemplate.opsForValue().get(nonNullKey);
            log.info("Completed get cache string, key={}", nonNullKey);
            return result;
        } catch (Exception e) {
            log.error("Failed to get cache string, key={}", key, e);
            throw new IllegalStateException("errors.cache.get.failed", e);
        }
    }

    @Override
    public void delete(String key) {
        log.info("Starting delete cache, key={}", key);
        if (key == null || key.trim().isEmpty()) {
            return;
        }
        String nonNullKey = Objects.requireNonNull(key, "Key must not be null");
        try {
            strTemplate.delete(nonNullKey);
        } catch (Exception e) {
            log.error("Cache delete failed on StringRedisTemplate, key={}", nonNullKey, e);
            throw new IllegalStateException("errors.cache.delete.failed", e);
        }

        try {
            template.delete(nonNullKey);
        } catch (Exception e) {
            log.error("Cache delete failed on RedisTemplate, key={}", nonNullKey, e);
            throw new IllegalStateException("errors.cache.delete.failed", e);
        }

        log.info("Completed delete cache, key={}", nonNullKey);
    }

    @Override
    public void deleteByPattern(String pattern) {
        log.info("Starting delete cache by pattern, pattern={}", pattern);
        if (pattern == null || pattern.trim().isEmpty()) {
            return;
        }
        String nonNullPattern = Objects.requireNonNull(pattern, "Pattern must not be null");
        Set<String> keys = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions().match(nonNullPattern).count(SCAN_BATCH_SIZE).build();

        try (Cursor<String> cursor = strTemplate.scan(options)) {
            while (cursor.hasNext()) {
                keys.add(cursor.next());
            }
        } catch (Exception e) {
            log.error("Cache scan failed, pattern={}", nonNullPattern, e);
            throw new IllegalStateException("errors.cache.delete.failed", e);
        }

        if (keys.isEmpty()) {
            log.info("Completed delete cache by pattern, pattern={}, deleted=0", nonNullPattern);
            return;
        }

        try {
            Long deleted = strTemplate.delete(keys);
            long result = deleted == null ? 0L : deleted;
            log.info("Completed delete cache by pattern, pattern={}, deleted={}", nonNullPattern, result);
        } catch (Exception e) {
            log.error("Cache delete failed by pattern, pattern={}", nonNullPattern, e);
            throw new IllegalStateException("errors.cache.delete.failed", e);
        }
    }

    private TimeUnit parseTimeUnit(String timeUnitStr) {
        if (timeUnitStr == null || timeUnitStr.trim().isEmpty()) {
            return TimeUnit.valueOf(Constants.REDIS.DEFAULT_TIME_UNIT);
        }
        try {
            return TimeUnit.valueOf(timeUnitStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return TimeUnit.valueOf(Constants.REDIS.DEFAULT_TIME_UNIT);
        }
    }

    private void setTimeout(String key, Integer timeout) {
        if (key == null || key.trim().isEmpty() || timeout == null || timeout <= 0) {
            return;
        }
        String defaultTimeUnit = redisProperties != null ? redisProperties.getDefaultTimeUnit() : Constants.REDIS.DEFAULT_TIME_UNIT;
        TimeUnit unit = Objects.requireNonNull(parseTimeUnit(defaultTimeUnit), "TimeUnit must not be null");
        String nonNullKey = Objects.requireNonNull(key, "Key must not be null");
        strTemplate.expire(nonNullKey, Duration.of(timeout, unit.toChronoUnit()));
    }
}

