package com.fpt.core.email.service.support;

import com.fpt.core.common.exception.BaseException;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Normalizes the module code that scopes email templates (for example SA or a project-specific module).
 * Module codes are free-form identifiers so projects can register their own without changing core.
 */
public final class EmailTemplateModuleSupport {

    private static final Pattern MODULE_CODE = Pattern.compile("^[A-Za-z0-9_-]{1,50}$");

    private EmailTemplateModuleSupport() {
    }

    public static String resolveModule(String moduleType) {
        if (moduleType == null || !MODULE_CODE.matcher(moduleType.trim()).matches()) {
            throw new BaseException("emailTemplate.invalidModule");
        }
        return moduleType.trim().toUpperCase(Locale.ROOT);
    }
}
