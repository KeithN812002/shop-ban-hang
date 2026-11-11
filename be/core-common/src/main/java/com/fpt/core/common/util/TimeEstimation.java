package com.fpt.core.common.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import lombok.experimental.UtilityClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import com.fpt.core.common.constant.Constants;

@UtilityClass
public final class TimeEstimation {

    private static final Logger logger = LoggerFactory.getLogger(TimeEstimation.class);

    private static final Map<String, Long> START_TIMES = new ConcurrentHashMap<>();

    public static void beginEstimate(String methodName) {
        long startTime = System.currentTimeMillis();
        START_TIMES.put(methodName, startTime);
    }

    public static void endEstimate(String methodName) {
        Long startTime = START_TIMES.remove(methodName);
        if (startTime == null) {
            logger.warn("endEstimate called for method '{}' without a matching beginEstimate", methodName);
            return;
        }

        long durationMs = System.currentTimeMillis() - startTime;

        MDC.put(Constants.LOGGING.MDC_METHOD_NAME, methodName);
        MDC.put(Constants.LOGGING.MDC_DURATION_MS, String.valueOf(durationMs));

        logger.info("Time to execute method '{}' is {} ms", methodName, durationMs);

        MDC.remove(Constants.LOGGING.MDC_METHOD_NAME);
        MDC.remove(Constants.LOGGING.MDC_DURATION_MS);
    }
}
