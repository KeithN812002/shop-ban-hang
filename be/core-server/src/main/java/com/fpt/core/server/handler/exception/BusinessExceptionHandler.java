package com.fpt.core.server.handler.exception;

import com.fpt.core.common.exception.BaseException;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.core.annotation.Order;

@ControllerAdvice
@Order(3)
public class BusinessExceptionHandler extends AbstractExceptionHandler {

    public BusinessExceptionHandler(MessageSource messageSource) {
        super(messageSource);
    }

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<?> handleBaseException(BaseException ex) {
        logError(ex);
        return createBaseExceptionResponse(ex);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        logError(ex);

        String rawMsg = ex.getMessage();
        if (rawMsg != null && rawMsg.contains("No enum constant")) {
            String message = getMessage(KEY_ERROR_INVALID_ENUM, request.getLocale());
            return createBusinessErrorResponse(message, getMessage(KEY_ERROR_INVALID_ENUM, request.getLocale()));
        }

        String message = rawMsg != null && !rawMsg.isEmpty()
                ? rawMsg
                : getMessage(KEY_ERROR_ILLEGAL_ARGUMENT, request.getLocale());
        return createBusinessErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleIllegalStateException(
            IllegalStateException ex,
            WebRequest request) {
        logError(ex);
        String message = ex.getMessage() != null && !ex.getMessage().isEmpty()
                ? ex.getMessage()
                : getMessage(KEY_ERROR_ILLEGAL_STATE, request.getLocale());
        return createBusinessErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(java.util.NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<?> handleNoSuchElementException(
            java.util.NoSuchElementException ex,
            WebRequest request) {
        logError(ex);
        String message = ex.getMessage() != null && !ex.getMessage().isEmpty()
                ? ex.getMessage()
                : getMessage(KEY_ERROR_NOT_FOUND, request.getLocale());
        return createErrorResponse(message, ex.getMessage());
    }
}
