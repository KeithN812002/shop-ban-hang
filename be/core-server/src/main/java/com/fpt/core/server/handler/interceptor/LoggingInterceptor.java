package com.fpt.core.server.handler.interceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fpt.core.security.util.SecurityUtils;
import com.fpt.core.common.util.TimeEstimation;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LoggingInterceptor implements HandlerInterceptor {

	private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);
	private static final String TRACE_ID_KEY = "traceId";
	private static final String USER_KEY = "user";

	@Override
	public boolean preHandle(@NonNull HttpServletRequest request,
							 @NonNull HttpServletResponse response,
							 @NonNull Object handler) {
		try {
			String username = SecurityUtils.getCurrentUsername();
			if (username != null && !username.isEmpty() && !"SYSTEM".equals(username)) {
				MDC.put(USER_KEY, username);
			}
		} catch (Exception e) {
			logger.error("Could not resolve current username for logging", e);
		}

		String traceId = MDC.get(TRACE_ID_KEY);
		if (traceId != null && !traceId.isEmpty()) {
			logger.info("Received request: {} {} from {}. TraceId: {}", request.getMethod(), request.getRequestURI(),
					request.getRemoteAddr(), traceId);
		} else {
			logger.info("Received request: {} {} from {}", request.getMethod(), request.getRequestURI(),
					request.getRemoteAddr());
		}
		TimeEstimation.beginEstimate(request.getRequestURI());
		return true;
	}

	@Override
	public void afterCompletion(@NonNull HttpServletRequest request,
								@NonNull HttpServletResponse response,
								@NonNull Object handler,
								@Nullable Exception ex) {
		try {
			String traceId = MDC.get(TRACE_ID_KEY);
			if (traceId != null && !traceId.isEmpty()) {
				logger.info("Sent response: {} {} with status {}. TraceId: {}", request.getMethod(),
						request.getRequestURI(), response.getStatus(), traceId);
			} else {
				logger.info("Sent response: {} {} with status {}", request.getMethod(), request.getRequestURI(),
						response.getStatus());
			}
			TimeEstimation.endEstimate(request.getRequestURI());
		} finally {
			MDC.remove(USER_KEY);
			MDC.remove(TRACE_ID_KEY);
		}
	}
}
