package com.fpt.core.common.util;

import com.fpt.core.common.constant.Constants;
import lombok.experimental.UtilityClass;

import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import java.util.Map;

@UtilityClass
public class DateFormats {

    public static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern(Constants.DATE_PATTERN.DAY);

    public static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern(Constants.DATE_PATTERN.MONTH);

    public static final DateTimeFormatter YEAR = DateTimeFormatter.ofPattern(Constants.DATE_PATTERN.YEAR);

    public static final DateTimeFormatter FULL_DATE = DateTimeFormatter.ofPattern(Constants.DATE_PATTERN.DATE);

    public static void putDateParts(Map<String, String> variables, TemporalAccessor date) {
        variables.put("dd", DAY.format(date));
        variables.put("mm", MONTH.format(date));
        variables.put("yyyy", YEAR.format(date));
    }

    public static String fullDate(TemporalAccessor date) {
        return date != null ? FULL_DATE.format(date) : "";
    }
}
