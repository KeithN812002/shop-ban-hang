package com.fpt.core.security.config;

import com.fpt.core.common.util.JsonUtils;
import com.fpt.core.common.util.MessageResolver;
import com.fpt.core.common.util.TraceUtils;
import com.fpt.core.common.web.Response;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

/**
 * @author hoanglm21@fpt.com
 */
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final MessageResolver messageResolver;

    @Override
    public void commence(@NonNull HttpServletRequest request,
                         HttpServletResponse response,
                         @NonNull AuthenticationException authException) throws IOException {
        Response<Object> body = Response.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .message(messageResolver.getMessage("handler.error.unauthorized"))
                .traceId(TraceUtils.getShortTraceId())
                .build();

        byte[] bytesValue = JsonUtils.writeValueAsBytes(body);

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.toString());
        response.getOutputStream().write(bytesValue);
        response.flushBuffer();
    }
}

