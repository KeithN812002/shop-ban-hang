package com.fpt.bom.shop.service.support;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/** Pure text/number helpers shared by the shop services. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TextSupport {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Lower-case, accent-free text ("Điện thoại" -> "dien thoai"). */
    public static String fold(String value) {
        if (value == null) {
            return "";
        }
        String folded = DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD)).replaceAll("");
        return folded.replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT).trim();
    }

    public static String slugify(String value) {
        String slug = NON_ALNUM.matcher(fold(value)).replaceAll("-").replaceAll("^-+|-+$", "");
        return slug.isEmpty() ? "item" : slug;
    }

    /** Slug with a short random suffix, used for names that are not unique. */
    public static String slugWithSuffix(String value, int maxBaseLength) {
        String base = slugify(value);
        if (base.length() > maxBaseLength) {
            base = base.substring(0, maxBaseLength).replaceAll("-+$", "");
        }
        return base + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public static String randomDigits(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    public static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public static String joinCsv(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return String.join(",", values.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
    }

    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static final String FILE_MARKER = "/shop/public/file/";

    /**
     * Stored image URLs always use the relative form {@code /shop/public/file/{key}}: an absolute URL or a
     * gateway-prefixed one that contains the marker is cut down to it; other (external) URLs are kept as is.
     */
    public static String fileUrl(String url) {
        String value = blankToNull(url);
        if (value == null) {
            return null;
        }
        int index = value.indexOf(FILE_MARKER);
        return index >= 0 ? value.substring(index) : value;
    }

    public static List<String> fileUrls(List<String> urls) {
        return urls == null ? List.of() : urls.stream().map(TextSupport::fileUrl).filter(java.util.Objects::nonNull)
                .toList();
    }

    public static String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }

    /** "Nguyễn Văn An" -> "N***n"; short names keep only the first letter. */
    public static String maskName(String name) {
        if (name == null || name.isBlank()) {
            return "***";
        }
        String trimmed = name.trim();
        if (trimmed.length() <= 2) {
            return trimmed.charAt(0) + "***";
        }
        return trimmed.charAt(0) + "***" + trimmed.charAt(trimmed.length() - 1);
    }

    public static int discountPercent(BigDecimal price, BigDecimal originalPrice) {
        if (price == null || originalPrice == null || originalPrice.signum() <= 0
                || originalPrice.compareTo(price) <= 0) {
            return 0;
        }
        return originalPrice.subtract(price)
                .multiply(BigDecimal.valueOf(100))
                .divide(originalPrice, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    public static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
