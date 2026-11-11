package com.fpt.core.server.config.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.Scopes;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenAPI30Configuration {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}")
    private String authServerUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        OpenAPI openAPI = new OpenAPI()
                .info(new Info()
                        .title("QLBH API")
                        .version("2.0"));

        if (StringUtils.hasText(authServerUrl)) {
            SecurityScheme oauth2Scheme = new SecurityScheme()
                    .type(SecurityScheme.Type.OAUTH2)
                    .description("OAuth2 authorization code flow")
                    .flows(new OAuthFlows()
                            .authorizationCode(new OAuthFlow()
                                    .authorizationUrl(authServerUrl + "/protocol/openid-connect/auth")
                                    .tokenUrl(authServerUrl + "/protocol/openid-connect/token")
                                    .scopes(new Scopes()
                                            .addString("openid", "for openid operations")
                                            .addString("profile", "for profile operations"))));

            openAPI.components(new Components().addSecuritySchemes(SECURITY_SCHEME_NAME, oauth2Scheme))
                    .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
        }

        return openAPI;
    }
}
