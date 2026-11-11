package com.fpt.core.keycloak.services;

import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface KeycloakService {

    void login(String username, String password);

    ResponseEntity<Map<String, Object>> refreshToken(String refreshToken);

    ResponseEntity<Map<String, Object>> exchangeAuthCode(String authCode, String redirectUri);

    ResponseEntity<Map<String, Object>> clientCredentialsToken();

    String createUser(String username, String password, String email, String firstName, String lastName,
                      boolean enabled, String isInternal);

    void updateUser(String username, String email, String firstName, String lastName,
                    boolean enabled, String isInternal);

    void deleteUser(String username);

    boolean userExists(String username);

    void setUserEnabled(String username, boolean enabled);

    void changeUserPassword(String username, String newPassword, boolean temporary);

    Map<String, Object> getPasswordPolicy();

    void updatePasswordPolicy(String passwordPolicy);

    Map<String, Object> validatePassword(String password);
}
