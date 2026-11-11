package com.fpt.core.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fpt.core.common.enums.ErrorEnum;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;

import java.util.List;

import com.fpt.core.common.constant.Constants;

@Data
@Builder
public class Response<T> {

    private int statusCode;
    private String message;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String traceId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private ErrorEnum error;

    public static <T> Response<T> ok(T data) {
        return Response.<T>builder()
                .statusCode(HttpStatus.OK.value())
                .data(data)
                .message(Constants.HTTP_RESPONSE.OK)
                .build();
    }

    public static <T> Response<T> ok() {
        return Response.<T>builder()
                .statusCode(HttpStatus.OK.value())
                .message(Constants.HTTP_RESPONSE.OK)
                .build();
    }

    public static <T> Response<List<T>> ok(Page<T> data) {
        return Response.<List<T>>builder()
                .statusCode(HttpStatus.OK.value())
                .data(data.getContent())
                .message(Constants.HTTP_RESPONSE.OK)
                .build();
    }

    public static <T> Response<T> notfound() {
        return Response.<T>builder()
                .statusCode(HttpStatus.NOT_FOUND.value())
                .build();
    }

    public static <T> Response<T> bad() {
        return Response.<T>builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .build();
    }
}
