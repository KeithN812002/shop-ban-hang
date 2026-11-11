package com.fpt.core.cache.config;

import com.fpt.core.common.constant.Constants;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "redis")
public class RedisProperties {
    private String host;
    private int port;
    private String clientSecret;
    private String defaultTimeUnit = Constants.REDIS.DEFAULT_TIME_UNIT;
    private String defaultExpire;
}

