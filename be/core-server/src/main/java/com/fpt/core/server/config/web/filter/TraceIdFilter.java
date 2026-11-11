package com.fpt.core.server.config.web.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class TraceIdFilter implements Filter, Ordered {
	private static final String TRACE_ID_KEY = "traceId";

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		try {
			String traceId = resolveTraceId((HttpServletRequest) request);
			MDC.put(TRACE_ID_KEY, traceId);
			chain.doFilter(request, response);
		} finally {
			MDC.remove(TRACE_ID_KEY);
		}
	}

	private String resolveTraceId(HttpServletRequest request) {
		return Optional.ofNullable(request.getHeader("X-Trace-Id"))
				.filter(h -> !h.isBlank())
				.orElse(UUID.randomUUID().toString());
	}

	@Override
	public int getOrder() {
		return Ordered.HIGHEST_PRECEDENCE;
	}
}
