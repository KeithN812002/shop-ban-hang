package com.fpt.core.server.config.app;

import java.time.Duration;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import lombok.Data;

@Data
@Validated
@ConfigurationProperties(prefix = "redis.config")
public class RedisConnectionProperties {
    private Duration readTimeout;
    
    @NotEmpty
    private List<String> nodes;
    
    private int maxTotalPool;
    private int maxIdlePool;
    private int minIdlePool;
    private Duration maxWait;
	
    public <T> GenericObjectPoolConfig<T> getPoolConfig() {
        GenericObjectPoolConfig<T> config = new GenericObjectPoolConfig<>();
        config.setMaxTotal(maxTotalPool);
        config.setMaxIdle(maxIdlePool);
        config.setMinIdle(minIdlePool);
        config.setMaxWait(maxWait);
        return config;
    }
}
