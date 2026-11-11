package com.fpt.core.common.config;

import com.fpt.core.common.constant.Constants;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

@Configuration
public class LocalizationConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename(Constants.LOCALIZATION.MESSAGE_BASENAME);
        messageSource.setDefaultEncoding(Constants.LOCALIZATION.DEFAULT_ENCODING);
        messageSource.setFallbackToSystemLocale(Constants.LOCALIZATION.FALLBACK_TO_SYSTEM_LOCALE);
        return messageSource;
    }
}