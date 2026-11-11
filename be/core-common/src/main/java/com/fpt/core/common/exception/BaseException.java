package com.fpt.core.common.exception;

import lombok.Getter;
import org.jetbrains.annotations.PropertyKey;

@Getter
public class BaseException extends RuntimeException {

    private static final String MESSAGES = "messages";

    private String code;
    private Object[] args;
    private String additionalInfo;
    private String solution;

    public BaseException(@PropertyKey(resourceBundle = MESSAGES) String code) {
        super(code);
        this.code = code;
        this.additionalInfo = null;
    }

    public BaseException(@PropertyKey(resourceBundle = MESSAGES) String code, Object... args) {
        super(code);
        this.code = code;
        this.args = args;
    }

    public BaseException(@PropertyKey(resourceBundle = MESSAGES) String code, String additionalInfo) {
        super(additionalInfo);
        this.code = code;
        this.additionalInfo = additionalInfo;
    }

    public BaseException(@PropertyKey(resourceBundle = MESSAGES) String code, String additionalInfo, String solution) {
        super(additionalInfo);
        this.code = code;
        this.additionalInfo = additionalInfo;
        this.solution = solution;
    }

    public BaseException(Throwable cause) {
        super(cause);
        this.code = null;
        this.additionalInfo = null;
    }

    public BaseException(String message, Throwable cause) {
        super(message, cause);
    }

    public static BaseException withResolvedMessage(String message, String messageDetail) {
        BaseException ex = new BaseException(message, (Throwable) null);
        ex.code = "";
        ex.additionalInfo = message;
        ex.solution = messageDetail;
        return ex;
    }
}
