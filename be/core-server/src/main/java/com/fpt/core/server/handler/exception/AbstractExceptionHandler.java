package com.fpt.core.server.handler.exception;

import java.sql.SQLException;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.enums.ErrorEnum;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TraceUtils;
import com.fpt.core.common.web.Response;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;

@Slf4j
public abstract class AbstractExceptionHandler {

    protected static final Locale DEFAULT_LOCALE = Locale.forLanguageTag(Constants.LOCALE.DEFAULT_LANGUAGE_TAG);
    protected static final String TRACE_ID_KEY = "traceId";
    protected static final Pattern TABLE_COLUMN_PATTERN = Pattern.compile("table '([^']*)', column '([^']*)'");
    protected static final String KEY_ERROR_GENERIC = "handler.error.generic";
    protected static final String KEY_ERROR_VALIDATION = "handler.error.validation";
    protected static final String KEY_ERROR_FIELD_TYPE_MISMATCH = "handler.error.field.type.mismatch";
    protected static final String KEY_ERROR_OCCURRED = "handler.error.occurred";
    protected static final String KEY_ERROR_FILE_NOT_FOUND = "handler.error.file.not.found";
    protected static final String KEY_ERROR_PARSE = "handler.error.parse";
    protected static final String KEY_ERROR_ACCESS_DENIED = "handler.error.access.denied";
    protected static final String KEY_ERROR_ILLEGAL_ARGUMENT = "handler.error.illegal.argument";
    protected static final String KEY_ERROR_ILLEGAL_STATE = "handler.error.illegal.state";
    protected static final String KEY_ERROR_DATA_ACCESS = "handler.error.data.access";
    protected static final String KEY_ERROR_NOT_FOUND = "handler.error.not.found";
    protected static final String KEY_ERROR_MISSING_PARAMETER = "handler.error.missing.parameter";
    protected static final String KEY_ERROR_CONSTRAINT_VIOLATION = "handler.error.constraint.violation";
    protected static final String KEY_ERROR_MESSAGE_NOT_READABLE = "handler.error.message.not.readable";
    protected static final String KEY_ERROR_TYPE_MISMATCH = "handler.error.type.mismatch";
    protected static final String KEY_ERROR_TRANSACTION_ROLLED_BACK = "handler.error.transaction.rolled.back";
    protected static final String KEY_ERROR_INVALID_ENUM = "handler.error.invalid.enum";

    protected static final Set<String> UNSAFE_PATTERNS = Set.of(
            "at ", "exception", "caused by", "c:\\", "/usr/", "java.lang",
            "com.fpt", "sql", "database", "connection", "password", "token", "secret");

    protected static final Set<String> SAFE_PATTERNS = Set.of(
            "required", "missing", "invalid", "not found", "not allowed",
            "forbidden", "unauthorized");

    protected final MessageSource messageSource;

    protected AbstractExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    protected String getMessage(String key, Object[] args, Locale locale) {
        Locale resolvedLocale = (locale != null) ? locale : DEFAULT_LOCALE;
        try {
            return messageSource.getMessage(Objects.requireNonNull(key), args, resolvedLocale);
        } catch (NoSuchMessageException e) {
            log.debug("i18n key not found: {}, using default locale", key);
            return messageSource.getMessage(Objects.requireNonNull(key), args, key, DEFAULT_LOCALE);
        }
    }

    protected String getMessage(String key, Locale locale) {
        return getMessage(key, null, locale);
    }

    protected void logError(Exception ex) {
        String traceId = MDC.get(TRACE_ID_KEY);
        String exceptionType = ex.getClass().getSimpleName();
        String exceptionMessage = ex.getMessage() != null ? ex.getMessage() : "No message";

        if (traceId != null && !traceId.isEmpty()) {
            log.error("ERROR [{}] - Message: {}. TraceId: {}",
                    exceptionType, exceptionMessage, traceId, ex);
        } else {
            log.error("ERROR [{}] - Message: {}", exceptionType, exceptionMessage, ex);
        }
    }

    protected void logWarn(String message) {
        String traceId = MDC.get(TRACE_ID_KEY);
        if (traceId != null && !traceId.isEmpty()) {
            log.warn("{}. TraceId: {}", message, traceId);
        } else {
            log.warn(message);
        }
    }

    protected ResponseEntity<?> createErrorResponse(String message,
            String messageDetail) {
        BaseException baseEx = BaseException.withResolvedMessage(message, messageDetail);
        return createBaseExceptionResponse(baseEx, ErrorEnum.TECHNICAL);
    }

    protected ResponseEntity<?> createBusinessErrorResponse(String message,
            String messageDetail) {
        BaseException baseEx = BaseException.withResolvedMessage(message, messageDetail);
        return createBaseExceptionResponse(baseEx, ErrorEnum.BUSINESS);
    }

    protected ResponseEntity<?> createValidationErrorResponse(String message,
            String messageDetail) {
        BaseException baseEx = BaseException.withResolvedMessage(message, messageDetail);
        return createBaseExceptionResponse(baseEx, ErrorEnum.VALIDATION);
    }

    protected ResponseEntity<?> handleDataLengthExceededException(Exception ex,
            WebRequest request) {
        String rootMessage = getRootCause(ex).getMessage();
        String table = "";
        String column = "";

        if (rootMessage != null) {
            Matcher matcher = TABLE_COLUMN_PATTERN.matcher(rootMessage);
            if (matcher.find()) {
                table = matcher.group(1);
                column = matcher.group(2);
            }
        }

        String i18nMsg = messageSource.getMessage("invalid.length.message", null, request.getLocale());
        String errorMsg = String.format("Table '%s', Column '%s'. %s", table, column, i18nMsg);
        return createErrorResponse(errorMsg, ex.getMessage());
    }

    protected ResponseEntity<Response<Object>> createBaseExceptionResponse(BaseException ex) {
        return createBaseExceptionResponse(ex, ErrorEnum.BUSINESS);
    }

    protected ResponseEntity<Response<Object>> createBaseExceptionResponse(BaseException ex, ErrorEnum error) {
        HttpStatus httpStatus = HttpStatus.BAD_REQUEST;
        Response<Object> res;

        String errMsg = ex.getAdditionalInfo();
        if (errMsg == null || errMsg.isBlank()) {
            errMsg = ex.getMessage();
        }
        if (errMsg == null) {
            errMsg = "";
        }

        String code = ex.getCode();
        if (code != null && !code.isBlank()) {
            Object[] args = ex.getArgs();
            if (args == null && (ex.getAdditionalInfo() != null || ex.getSolution() != null)) {
                args = new Object[] { ex.getAdditionalInfo(), ex.getSolution() };
            }

            String i18nMsg = getMessage(code, args, DEFAULT_LOCALE);
            if (i18nMsg != null && !i18nMsg.isBlank() && !code.equals(i18nMsg)) {
                errMsg = i18nMsg;
            }
        }

        if ("APP_DATA404".equals(code)) {
            httpStatus = HttpStatus.NOT_FOUND;
            res = Response.notfound();
        } else {
            res = Response.bad();
        }
        res.setMessage(errMsg);
        res.setTraceId(TraceUtils.getShortTraceId());
        res.setError(error);

        return ResponseEntity.status(httpStatus).body(res);
    }

    protected String resolveErrorMessage(String originalMsg, WebRequest request) {
        if (originalMsg == null) {
            return getMessage(KEY_ERROR_GENERIC, request.getLocale());
        }

        if (originalMsg.startsWith("service.")
                || originalMsg.startsWith("errors.")
                || originalMsg.startsWith("maquette.")) {
            try {
                String i18nMsg = messageSource.getMessage(originalMsg, null, request.getLocale());
                if (!i18nMsg.trim().isEmpty()) {
                    return i18nMsg;
                }
            } catch (NoSuchMessageException e) {
                log.debug("i18n key not found: {}", originalMsg);
            } catch (Exception e) {
                log.debug("Failed to get i18n message for key: {}", originalMsg, e);
            }
            return originalMsg;
        }

        if (isSafeMessage(originalMsg)) {
            return originalMsg;
        }

        return getMessage(KEY_ERROR_GENERIC, request.getLocale());
    }

    protected boolean isDataLengthExceededException(Throwable ex) {
        Throwable root = getRootCause(ex);
        String message = root.getMessage();

        if (message == null) {
            return false;
        }

        if (message.toLowerCase().contains("truncated")) {
            return true;
        }

        if (root instanceof SQLException sqlEx) {
            return sqlEx.getErrorCode() == 8152;
        }

        return false;
    }

    protected Throwable getRootCause(Throwable throwable) {
        Throwable cause = throwable.getCause();
        return (cause != null && cause != throwable) ? getRootCause(cause) : throwable;
    }

    protected boolean isSafeMessage(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }

        String lowerMsg = message.toLowerCase();

        for (String pattern : UNSAFE_PATTERNS) {
            if (lowerMsg.contains(pattern)) {
                return false;
            }
        }

        for (String pattern : SAFE_PATTERNS) {
            if (lowerMsg.contains(pattern)) {
                return true;
            }
        }

        return message.length() < 200
                && !message.contains("@")
                && !message.contains("Exception");
    }

    @SuppressWarnings("java:S2068")
    protected String sanitizeDatabaseError(String message) {
        if (message == null) {
            return "";
        }

        return message
                .replaceAll("(?i)password[=:]\\s*[^\\s,;]+", "password=***")
                .replaceAll("(?i)token[=:]\\s*[^\\s,;]+", "token=***")
                .replaceAll("(?i)secret[=:]\\s*[^\\s,;]+", "secret=***")
                .replaceAll("(?i)connection string[=:]\\s*[^\\s,;]+", "connection string=***");
    }

    protected String sanitizeMessage(String message) {
        if (message == null) {
            return "";
        }

        if (message.contains("\n") || message.contains("at ")) {
            return message.split("\n")[0];
        }

        return message;
    }
}
