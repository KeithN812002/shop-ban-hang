package com.fpt.core.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class AppSsoProperties {
    /** Display name of the application, injected into outgoing emails as {appName}. */
    private String appName = "Core Application";
    private String loginUrl;
    private Email email = new Email();
    private Otp otp = new Otp();

    @Data
    public static class Email {
        private Crypto crypto = new Crypto();

        @Data
        public static class Crypto {
            private String key;
        }
    }

    @Data
    public static class Otp {
        private Integer changePasswordExpireMinutes;
        private Integer changePasswordCooldownMinutes;
    }

}
