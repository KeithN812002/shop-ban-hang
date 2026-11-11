package com.fpt.core.server.handler.exception;

import com.fpt.core.common.enums.ErrorEnum;
import com.fpt.core.common.util.TraceUtils;
import com.fpt.core.common.web.Response;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.core.annotation.Order;
import org.springframework.util.StringUtils;

import java.util.Locale;

@ControllerAdvice
@Order(2)
public class SecurityExceptionHandler extends AbstractExceptionHandler {

    public SecurityExceptionHandler(MessageSource messageSource) {
        super(messageSource);
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<Response<Object>> handleAccessDeniedException(
            AccessDeniedException ex,
            WebRequest request) {
        Locale locale = request.getLocale();
        logWarn(getMessage(KEY_ERROR_OCCURRED, locale));

        String message = resolveAccessDeniedMessage(ex.getMessage(), locale);
        Response<Object> response = Response.builder()
                .statusCode(HttpStatus.FORBIDDEN.value())
                .message(message)
                .traceId(TraceUtils.getShortTraceId())
                .error(ErrorEnum.SECURITY)
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    private String resolveAccessDeniedMessage(String messageKey, Locale locale) {
        if (StringUtils.hasText(messageKey)) {
            String resolved = getMessage(messageKey, locale);
            if (!messageKey.equals(resolved)) {
                return resolved;
            }
        }
        return getMessage(KEY_ERROR_ACCESS_DENIED, locale);
    }
}
