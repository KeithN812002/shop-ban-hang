package com.fpt.core.server.handler.exception;

import java.io.FileNotFoundException;
import java.text.ParseException;

import org.springframework.context.MessageSource;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.core.annotation.Order;

@ControllerAdvice
@Order()
public class SystemExceptionHandler extends AbstractExceptionHandler {

    public SystemExceptionHandler(MessageSource messageSource) {
        super(messageSource);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAllUncaughtException(Exception ex, WebRequest request) {
        logError(ex);

        if (isDataLengthExceededException(ex)) {
            return handleDataLengthExceededException(ex, request);
        }

        String finalErrMsg = resolveErrorMessage(ex.getMessage(), request);
        return createErrorResponse(finalErrMsg, ex.getMessage());
    }

    @ExceptionHandler(FileNotFoundException.class)
    public ResponseEntity<?> handleFileNotFoundException(
            FileNotFoundException ex,
            WebRequest request) {
        logError(ex);
        String message = getMessage(KEY_ERROR_FILE_NOT_FOUND, request.getLocale());
        return createErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(ParseException.class)
    public ResponseEntity<?> handleParseException(
            ParseException ex,
            WebRequest request) {
        logError(ex);
        String message = getMessage(KEY_ERROR_PARSE, request.getLocale());
        return createErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(DataAccessException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<?> handleDataAccessException(
            DataAccessException ex,
            WebRequest request) {
        logError(ex);

        if (ex instanceof DataIntegrityViolationException) {
            String message = getMessage(KEY_ERROR_DATA_ACCESS, request.getLocale());
            return createErrorResponse(message, sanitizeDatabaseError(ex.getMessage()));
        }

        if (ex instanceof EmptyResultDataAccessException) {
            String message = getMessage(KEY_ERROR_NOT_FOUND, request.getLocale());
            return createErrorResponse(message, sanitizeDatabaseError(ex.getMessage()));
        }

        String message = getMessage(KEY_ERROR_DATA_ACCESS, request.getLocale());
        return createErrorResponse(message, sanitizeDatabaseError(ex.getMessage()));
    }

    @ExceptionHandler({TransactionSystemException.class, UnexpectedRollbackException.class})
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<?> handleTransactionException(
            Exception ex,
            WebRequest request) {
        logError(ex);

        Throwable rootCause = getRootCause(ex);
        String rootMessage = rootCause.getMessage();

        if (rootMessage != null && rootMessage.contains("Transaction silently rolled back")) {
            String message = getMessage(KEY_ERROR_TRANSACTION_ROLLED_BACK, request.getLocale());
            return createErrorResponse(message, sanitizeMessage(rootMessage));
        }

        String message = getMessage(KEY_ERROR_TRANSACTION_ROLLED_BACK, request.getLocale());
        return createErrorResponse(message, sanitizeMessage(ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex,
            WebRequest request) {
        logError(ex);
        String message = getMessage(KEY_ERROR_MESSAGE_NOT_READABLE, request.getLocale());
        return createErrorResponse(message, sanitizeMessage(ex.getMessage()));
    }
}
