package com.fpt.core.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.fpt.core.common.properties.AuthorizationProperties;
import com.fpt.core.common.properties.AppLoggingProperties;
import com.fpt.core.common.properties.AppSsoProperties;
import com.fpt.core.server.config.app.RedisConnectionProperties;

@EnableDiscoveryClient
@ComponentScan({
        "com.fpt.core",
        "com.fpt.bom",
        "com.fpt.res"
})
@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableConfigurationProperties({
        AuthorizationProperties.class,
        AppLoggingProperties.class,
        AppSsoProperties.class,
        RedisConnectionProperties.class
})
public class ApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }
}
