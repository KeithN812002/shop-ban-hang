package com.fpt.bom.shop.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Cross-origin access for the browser apps. The filter runs before the Spring Security chain (which does not
 * enable CORS itself), so preflight requests are answered without a token. Disabled while
 * {@code shop.cors.allowed-origins} is empty.
 */
@Configuration
@RequiredArgsConstructor
public class ShopCorsConfig {

    private final ShopProperties shopProperties;

    @Bean
    public FilterRegistrationBean<CorsFilter> shopCorsFilter() {
        List<String> origins = shopProperties.getCors().getAllowedOrigins();
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.setEnabled(origins != null && !origins.isEmpty());
        return registration;
    }
}
