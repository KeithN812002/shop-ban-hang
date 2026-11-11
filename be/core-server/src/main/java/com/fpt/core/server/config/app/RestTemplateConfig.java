package com.fpt.core.server.config.app;

import java.util.Objects;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    private static final int CONNECT_TIMEOUT_MILLIS = 5000;
    private static final int POOL_LEASE_TIMEOUT_MILLIS = 5000;
    private static final int SOCKET_TIMEOUT_MILLIS = 30000;
    private static final int IDLE_CONNECTION_EVICTION_SECONDS = 30;

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setDefaultConnectionConfig(ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(CONNECT_TIMEOUT_MILLIS))
                .build());

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(POOL_LEASE_TIMEOUT_MILLIS))
                .setResponseTimeout(Timeout.ofMilliseconds(SOCKET_TIMEOUT_MILLIS))
                .build();

        HttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .evictIdleConnections(Timeout.ofSeconds(IDLE_CONNECTION_EVICTION_SECONDS))
                .build();

        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(Objects.requireNonNull(httpClient)));
    }
}
