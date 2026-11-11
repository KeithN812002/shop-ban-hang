package com.fpt.core.server.config.app;

import com.fpt.core.cache.config.RedisProperties;

import java.time.Duration;
import java.util.Objects;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

import com.fpt.core.common.enums.TimeEnum;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.resource.DefaultClientResources;

import tools.jackson.databind.json.JsonMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@RequiredArgsConstructor
public class RedisConfig {
    private final RedisProperties redisProperties;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "redis.active-cluster", havingValue = "false")
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(Objects.requireNonNull(redisProperties.getHost(), "redis.host must not be null"));
        config.setPort(redisProperties.getPort());
        config.setPassword(Objects.requireNonNull(redisProperties.getClientSecret(), "redis.client-secret must not be null"));

        return new LettuceConnectionFactory(config);
    }

    @Profile("!local")
    @Bean(destroyMethod = "shutdown")
    @ConditionalOnProperty(name = "redis.active-cluster", havingValue = "true")
    public ClientResources redisClientResources() {
        return DefaultClientResources.create();
    }

    @Bean
    @ConditionalOnProperty(name = "redis.active-cluster", havingValue = "true")
    public ClientOptions redisClientOptions() {
        return ClientOptions.builder()
                .disconnectedBehavior(ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
                .autoReconnect(true).build();
    }

    @Bean
    @ConditionalOnProperty(name = "redis.active-cluster", havingValue = "true")
    public LettucePoolingClientConfiguration lettucePoolingClientConfiguration(
            ClientOptions redisClientOptions, ClientResources redisClientResources,
            RedisConnectionProperties redisProperties) {
        Duration readTimeout = Objects.requireNonNull(
                Objects.requireNonNullElse(redisProperties.getReadTimeout(), Duration.ofSeconds(30)),
                "readTimeout must not be null");
        return LettucePoolingClientConfiguration.builder()
                .commandTimeout(readTimeout)
                .poolConfig(Objects.requireNonNull(redisProperties.getPoolConfig(), "poolConfig must not be null"))
                .clientOptions(Objects.requireNonNull(redisClientOptions, "redisClientOptions must not be null"))
                .clientResources(Objects.requireNonNull(redisClientResources, "redisClientResources must not be null"))
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "redis.active-cluster", havingValue = "true")
    public RedisClusterConfiguration customRedisCluster(RedisConnectionProperties redisConnectionProperties) {
        RedisClusterConfiguration config = new RedisClusterConfiguration(
                Objects.requireNonNull(redisConnectionProperties.getNodes(), "redis nodes must not be null"));
        config.setPassword(Objects.requireNonNull(redisProperties.getClientSecret(), "redis.client-secret must not be null"));
        return config;
    }

    @Bean
    @Primary
    public RedisCacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        Duration duration = this.getDuration();
        RedisCacheConfiguration cacheConfig = myDefaultCacheConfig(duration).disableCachingNullValues();
        return RedisCacheManager.builder(
                Objects.requireNonNull(redisConnectionFactory, "redisConnectionFactory must not be null"))
                .cacheDefaults(cacheConfig).build();
    }

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonRedisSerializer());
        template.setConnectionFactory(redisConnectionFactory);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    @Primary
    public StringRedisTemplate strRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        StringRedisTemplate redisTemplate = new StringRedisTemplate();
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        return redisTemplate;
    }

    private RedisCacheConfiguration myDefaultCacheConfig(Duration duration) {
        return RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Objects.requireNonNull(duration, "duration must not be null"))
                .serializeValuesWith(SerializationPair.fromSerializer(jsonRedisSerializer()));
    }

    private static GenericJacksonJsonRedisSerializer jsonRedisSerializer() {
        return GenericJacksonJsonRedisSerializer.builder(JsonMapper::builderWithJackson2Defaults)
                .enableUnsafeDefaultTyping()
                .enableSpringCacheNullValueSupport()
                .build();
    }

    private Duration getDuration() {
        String timeUnit = redisProperties.getDefaultTimeUnit();
        String timeoutStr = redisProperties.getDefaultExpire();

        if (timeoutStr == null || timeoutStr.isBlank()) {
            return Duration.ofSeconds(60);
        }

        int timeout = Integer.parseInt(timeoutStr.trim());

        if (timeUnit == null || timeUnit.isBlank()) {
            timeUnit = String.valueOf(TimeEnum.SECONDS);
        }

        return switch (timeUnit) {
            case "MILLISECONDS" -> Duration.ofMillis(timeout);
            case "MINUTES" -> Duration.ofMinutes(timeout);
            case "HOURS" -> Duration.ofHours(timeout);
            case "DAYS" -> Duration.ofDays(timeout);
            default -> Duration.ofSeconds(timeout);
        };
    }
}