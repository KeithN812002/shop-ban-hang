package com.fpt.core.keycloak.config;

import com.fpt.core.common.properties.HttpProperties;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@NoArgsConstructor
@Component
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakProperties {

    private String authServerUrl;
    private String realm;
    private Resource resource = new Resource();
    private Credentials credentials = new Credentials();
    private HttpProperties http = new HttpProperties();
    /**
     * Extra scope requested for the service-account token used on the Admin REST API.
     * Keycloak 26.8+ only accepts admin calls whose token carries the audience added by the
     * {@code kc-admin-api} client scope; leave empty for older Keycloak versions.
     */
    private String adminTokenScope;

    @Data
    @NoArgsConstructor
    public static class Resource {
        private String app;
    }

    @Data
    @NoArgsConstructor
    public static class Credentials {
        private String secret;
    }

    public String getTokenEndpoint() {
        return String.format("%s/realms/%s/protocol/openid-connect/token", authServerUrl, realm);
    }

    public String getLogoutEndpoint() {
        return String.format("%s/realms/%s/protocol/openid-connect/logout", authServerUrl, realm);
    }

    public String getAdminUsersEndpoint() {
        return String.format("%s/admin/realms/%s/users", authServerUrl, realm);
    }

    public String getAdminUserEndpoint(String userId) {
        return String.format("%s/admin/realms/%s/users/%s", authServerUrl, realm, userId);
    }

    public String getAdminRealmEndpoint() {
        return String.format("%s/admin/realms/%s", authServerUrl, realm);
    }
}
