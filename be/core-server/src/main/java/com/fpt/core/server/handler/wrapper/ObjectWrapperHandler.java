package com.fpt.core.server.handler.wrapper;

import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import com.fpt.core.common.web.Response;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

@ControllerAdvice
public class ObjectWrapperHandler implements ResponseBodyAdvice<Object> {

	@Override
	public boolean supports(@NonNull MethodParameter returnType,
							@NonNull Class<? extends HttpMessageConverter<?>> converterType) {
		Class<?> containingClass = returnType.getContainingClass();
		if (containingClass.getName().startsWith("org.springdoc")) {
			return false;
		}
		return !ResponseEntity.class.isAssignableFrom(returnType.getParameterType())
				&& !returnType.getParameterType().equals(byte[].class);
	}

	@Override
	public Object beforeBodyWrite(@Nullable Object body,
								  @NonNull MethodParameter returnType,
								  @NonNull MediaType selectedContentType,
								  @NonNull Class<? extends HttpMessageConverter<?>> selectedConverterType,
								  @NonNull ServerHttpRequest request,
								  @NonNull ServerHttpResponse response) {
		if (body instanceof Response) {
			return body;
		}

		if (body == null) {
			return Response.ok();
		}

		if (body instanceof Page<?> page) {
			return Response.ok(page);
		}

		return Response.ok(body);
	}
}
