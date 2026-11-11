package com.fpt.core.common.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.slf4j.MDC;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TraceUtils {

    private static final int SHORT_TRACE_ID_LENGTH = 12;

    public static String getShortTraceId() {
        String traceId = MDC.get("traceId");
        if (traceId == null || traceId.isBlank()) {
            return null;
        }
        if (traceId.length() <= SHORT_TRACE_ID_LENGTH) {
            return traceId;
        }
        return traceId.substring(traceId.length() - SHORT_TRACE_ID_LENGTH);
    }
}
