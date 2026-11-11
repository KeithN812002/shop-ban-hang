package com.fpt.core.server.handler.exception;

import java.util.ArrayList;
import java.util.List;

import com.fpt.core.common.enums.ErrorEnum;
import com.fpt.core.common.util.TraceUtils;
import com.fpt.core.common.web.Response;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.core.annotation.Order;

@ControllerAdvice
@Order(1)
public class ValidationExceptionHandler extends AbstractExceptionHandler {

    public ValidationExceptionHandler(MessageSource messageSource) {
        super(messageSource);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Response<List<ValidationError>>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        List<ValidationError> errors = new ArrayList<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            FieldError fieldError = (FieldError) error;
            String fieldName = fieldError.getField();
            String errorMessage = fieldError.isBindingFailure()
                    ? getMessage(KEY_ERROR_FIELD_TYPE_MISMATCH, new Object[] { fieldName }, request.getLocale())
                    : error.getDefaultMessage();

            if (errorMessage == null || errorMessage.trim().isEmpty()) {
                errorMessage = HttpStatus.BAD_REQUEST.getReasonPhrase();
            }

            errors.add(new ValidationError(fieldName, errorMessage));
        });

        Response<List<ValidationError>> response = Response.bad();
        response.setMessage(getMessage(KEY_ERROR_VALIDATION, request.getLocale()));
        response.setTraceId(TraceUtils.getShortTraceId());
        response.setError(ErrorEnum.VALIDATION);
        response.setData(errors);

        logWarn(getMessage(KEY_ERROR_VALIDATION, request.getLocale()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleConstraintViolationException(
            ConstraintViolationException ex,
            WebRequest request) {
        logError(ex);

        String violations = ex.getConstraintViolations().stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(java.util.stream.Collectors.joining(", "));

        String message = getMessage(KEY_ERROR_CONSTRAINT_VIOLATION, request.getLocale()) + ": " + violations;
        return createValidationErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex,
            WebRequest request) {
        logWarn(String.format("Missing request parameter: %s", ex.getParameterName()));
        String message = getMessage(
                KEY_ERROR_MISSING_PARAMETER,
                new Object[] { ex.getParameterName(), ex.getParameterType() },
                request.getLocale());
        return createValidationErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleMissingRequestHeaderException(
            MissingRequestHeaderException ex,
            WebRequest request) {
        logWarn(String.format("Missing request header: %s", ex.getHeaderName()));
        String message = getMessage(
                KEY_ERROR_MISSING_PARAMETER,
                new Object[] { ex.getHeaderName(), ex.getParameter().getParameterType().getSimpleName() },
                request.getLocale());
        return createValidationErrorResponse(message, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            WebRequest request) {
        Class<?> requiredType = ex.getRequiredType();
        String requiredTypeName = requiredType != null ? requiredType.getSimpleName() : "unknown";

        logWarn(String.format("Type mismatch for parameter: %s - expected: %s, actual: %s",
                ex.getName(), requiredTypeName, ex.getValue()));
        String message = getMessage(
                KEY_ERROR_TYPE_MISMATCH,
                new Object[] { ex.getName(), requiredTypeName, ex.getValue() },
                request.getLocale());
        return createValidationErrorResponse(message, ex.getMessage());
    }
}
