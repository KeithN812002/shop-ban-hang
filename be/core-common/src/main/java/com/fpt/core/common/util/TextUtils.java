package com.fpt.core.common.util;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

import lombok.experimental.UtilityClass;

@UtilityClass
public final class TextUtils {

    public static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    public static String escapeSqlLike(String keyword) {
        if (keyword == null) {
            return null;
        }

        return keyword.replace("\\", "\\\\")
                .replace("_", "\\_")
                .replace("%", "\\%")
                .replace("[", "\\[")
                .replace("]", "\\]");
    }

    public static <T> List<T> emptyIfNull(List<T> items) {
        return items == null ? List.of() : items;
    }

    public static <T> List<String> distinctNonBlank(Collection<T> items, Function<T, String> extractor) {
        return items.stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .filter(code -> !code.isBlank())
                .distinct()
                .toList();
    }
}
