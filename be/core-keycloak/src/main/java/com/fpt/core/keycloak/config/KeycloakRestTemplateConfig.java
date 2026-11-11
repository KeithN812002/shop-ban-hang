package com.fpt.core.keycloak.config;

import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration("keycloakRestTemplateConfig")
public class KeycloakRestTemplateConfig {

    @Bean("keycloakRestTemplate")
    public RestTemplate keycloakRestTemplate(RestTemplateBuilder builder, KeycloakProperties keycloakProperties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) keycloakProperties.getHttp().getConnectTimeout().toMillis());
        factory.setReadTimeout((int) keycloakProperties.getHttp().getReadTimeout().toMillis());
        return builder.requestFactory(() -> new BufferingClientHttpRequestFactory(factory)).build();
    }
}
