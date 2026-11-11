package com.fpt.core.security.util;

import java.util.Base64;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fpt.core.common.util.JsonUtils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TokenUtils {

    private static final Logger log = LoggerFactory.getLogger(TokenUtils.class);

    public static Map<String, Object> getPayload(String token) {
        if (StringUtils.isEmpty(token)) {
            return null;
        }

        String[] parts = token.split("\\.");
        if (parts.length < 3) {
            log.warn("Invalid JWT token format: expected 3 parts separated by dots");
            return null;
        }

        try {
            return JsonUtils.convertJsonStringToMap(decode(parts[1]));
        } catch (Exception e) {
            log.warn("Failed to parse JWT payload: {}", e.getMessage());
            return null;
        }
    }

    private static String decode(String encodedString) {
        return new String(Base64.getUrlDecoder().decode(encodedString));
    }
}
