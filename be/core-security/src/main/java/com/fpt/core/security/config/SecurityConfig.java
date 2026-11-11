package com.fpt.core.security.config;

import com.fpt.core.cache.service.CacheService;
import com.fpt.core.common.properties.AuthorizationProperties;
import com.fpt.core.common.util.MessageResolver;
import com.fpt.core.security.filter.CustomAuthorizationFilter;
import com.fpt.core.security.permission.UserPermissionProvider;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthorizationProperties authorizationProperties;
    private final ApplicationContext applicationContext;
    private final CacheService cacheService;
    private final MessageResolver messageResolver;

    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) {
        List<String> whitelist = getWhitelistFromConsul();
        if (whitelist.isEmpty()) {
            http.securityMatcher("/__no_public_endpoints__");
            return http.build();
        }

        String[] whitelistArray = whitelist.toArray(new String[0]);

        http.securityMatcher(whitelistArray)
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain oauth2FilterChain(HttpSecurity http,
            CustomAuthorizationFilter customAuthorizationFilter,
            AuthenticationEntryPoint restAuthenticationEntryPoint) {
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(restAuthenticationEntryPoint))
                .addFilterAfter(customAuthorizationFilter, BasicAuthenticationFilter.class)
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .jwt(Customizer.withDefaults()));

        return http.build();
    }

    @Bean
    public CustomAuthorizationFilter customAuthorizationFilter(
            Map<String, RequestMappingHandlerMapping> handlerMappings,
            ObjectProvider<UserPermissionProvider> permissionProviders) {
        return new CustomAuthorizationFilter(
                getWhitelistFromConsul(),
                authorizationProperties,
                applicationContext,
                handlerMappings,
                cacheService,
                messageResolver,
                permissionProviders.getIfAvailable());
    }

    @Bean
    public AuthenticationEntryPoint restAuthenticationEntryPoint() {
        return new RestAuthenticationEntryPoint(messageResolver);
    }

    private List<String> getWhitelistFromConsul() {
        List<String> whitelist = authorizationProperties.getWhiteList();
        return whitelist != null ? whitelist : Collections.emptyList();
    }
}
