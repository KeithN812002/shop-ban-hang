package com.fpt.core.common.util;

import com.fpt.core.common.constant.Constants;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.PropertyKey;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class MessageResolver {

    private static final String MESSAGES = "messages";

    private static final Locale DEFAULT_LOCALE = Locale.forLanguageTag(Constants.LOCALE.DEFAULT_LANGUAGE_TAG);

    private final MessageSource messageSource;

    public String getMessage(@PropertyKey(resourceBundle = MESSAGES) String key) {
        try {
            Locale locale = resolveLocale();
            return messageSource.getMessage(Objects.requireNonNull(key), null, key, locale);
        } catch (NoSuchMessageException ignored) {
            return key;
        }
    }

    public String getMessage(@PropertyKey(resourceBundle = MESSAGES) String key, Object[] args) {
        try {
            Locale locale = resolveLocale();
            return messageSource.getMessage(Objects.requireNonNull(key), args, key, locale);
        } catch (NoSuchMessageException ignored) {
            return key;
        }
    }

    private Locale resolveLocale() {
        Locale locale = LocaleContextHolder.getLocale();
        if (Locale.ROOT.equals(locale)) {
            return DEFAULT_LOCALE;
        }
        return locale;
    }
}
