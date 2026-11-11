package com.fpt.bom.shop.service.support.chat;

import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.ChatDto.ChatResponse;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.support.TextSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Keyword/price intent parser used when the AI service is unavailable. It answers from the same tools as the
 * model, with templated Vietnamese replies.
 */
@Component
@RequiredArgsConstructor
public class RuleBasedChatEngine {

    private static final int LIMIT = 5;
    private static final Pattern AMOUNT = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|ty)?\\b");
    private static final Pattern RANGE = Pattern.compile(
            "tu\\s+(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|ty)?\\s+(?:den|toi)\\s+(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|ty)?");
    private static final Pattern MAX_ONLY = Pattern
            .compile("(?:duoi|toi da|khong qua|<)\\s*(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|ty)?");
    private static final Pattern MIN_ONLY = Pattern
            .compile("(?:tren|tu|toi thieu|tro len|>)\\s*(\\d+(?:[.,]\\d+)?)\\s*(k|nghin|ngan|tr|trieu|m|ty)?");
    private static final Set<String> STOPWORDS = Set.copyOf(java.util.List.of("toi", "minh", "muon", "mua", "tim", "kiem", "cho", "xin",
            "co", "khong", "nao", "la", "va", "cua", "cac", "mot", "nhung", "gi", "hay", "giup", "can", "ban",
            "shop", "san", "pham", "goi", "y", "di", "nhe", "voi", "duoc", "ve", "mau", "loai", "dang", "hien",
            "nay", "thi", "o", "tai", "xem", "rat", "gia", "tien", "dong", "d", "vnd", "duoi", "tren", "tu",
            "den", "toi", "da", "khoang"));

    private final ShopChatTools tools;
    private final CategoryService categoryService;

    public ChatResponse answer(String message) {
        String text = TextSupport.fold(message);
        BigDecimal[] range = priceRange(text);
        BigDecimal min = range[0];
        BigDecimal max = range[1];
        Optional<Category> category = categoryService.findActiveByName(categoryPhrase(text));
        String categoryName = category.map(Category::getName).orElse(null);

        boolean trending = containsAny(text, "xu huong", "hot", "trend", "thinh hanh");
        boolean bestSeller = containsAny(text, "ban chay", "best seller", "pho bien");
        boolean sale = containsAny(text, "giam gia", "sale", "khuyen mai", "uu dai");
        boolean cheap = Pattern.compile("\\b(re|gia re|tiet kiem)\\b").matcher(text).find();

        List<ProductCard> products;
        String description;
        if (sale) {
            products = tools.flashDeals(LIMIT);
            description = "đang giảm giá";
        } else if (trending) {
            products = tools.trending(categoryName, LIMIT);
            description = "đang được quan tâm nhiều";
        } else if (bestSeller) {
            products = tools.bestSellers(categoryName, LIMIT);
            description = "bán chạy";
        } else {
            String keyword = keyword(text, categoryName);
            if (keyword.isEmpty() && categoryName == null && min == null && max == null && !cheap) {
                return new ChatResponse("Chào bạn! Mình có thể gợi ý sản phẩm theo danh mục, khoảng giá "
                        + "(ví dụ \"áo thun dưới 300k\"), sản phẩm xu hướng, bán chạy hoặc đang giảm giá. "
                        + "Bạn đang quan tâm điều gì?", List.of());
            }
            products = tools.searchProducts(keyword.isEmpty() ? null : keyword, categoryName, min, max,
                    cheap ? "price_asc" : "best_selling", LIMIT);
            description = "phù hợp với yêu cầu của bạn";
        }
        // Price bounds also narrow the intent-based lists, which do not take them directly.
        BigDecimal lower = min;
        BigDecimal upper = max;
        products = products.stream()
                .filter(p -> lower == null || p.price().compareTo(lower) >= 0)
                .filter(p -> upper == null || p.price().compareTo(upper) <= 0).toList();

        if (products.isEmpty()) {
            return new ChatResponse("Rất tiếc, mình chưa tìm thấy sản phẩm phù hợp. Bạn thử đổi từ khóa, "
                    + "danh mục hoặc khoảng giá nhé.", List.of());
        }
        NumberFormat money = NumberFormat.getInstance(Locale.forLanguageTag("vi-VN"));
        String lines = products.stream()
                .map(p -> "- " + p.name() + " – " + money.format(p.price()) + "đ"
                        + (p.discountPercent() > 0 ? " (giảm " + p.discountPercent() + "%)" : ""))
                .collect(Collectors.joining("\n"));
        return new ChatResponse("Mình gợi ý " + products.size() + " sản phẩm " + description + ":\n" + lines,
                products);
    }

    // ---- parsing ----

    /** Returns {min, max}; either may be null. */
    BigDecimal[] priceRange(String text) {
        Matcher range = RANGE.matcher(text);
        if (range.find()) {
            String unitHi = range.group(4);
            String unitLo = range.group(2) != null ? range.group(2) : unitHi;
            return new BigDecimal[] { amount(range.group(1), unitLo), amount(range.group(3), unitHi) };
        }
        BigDecimal min = null;
        BigDecimal max = null;
        Matcher maxOnly = MAX_ONLY.matcher(text);
        if (maxOnly.find()) {
            max = amount(maxOnly.group(1), maxOnly.group(2));
        }
        Matcher minOnly = MIN_ONLY.matcher(text);
        if (minOnly.find() && !(max != null && minOnly.start() == maxOnly.start())) {
            min = amount(minOnly.group(1), minOnly.group(2));
        }
        return new BigDecimal[] { min, max };
    }

    private static BigDecimal amount(String number, String unit) {
        BigDecimal value = new BigDecimal(number.replace(',', '.'));
        long factor = switch (unit == null ? "" : unit) {
            case "k", "nghin", "ngan" -> 1_000L;
            case "tr", "trieu", "m" -> 1_000_000L;
            case "ty" -> 1_000_000_000L;
            default -> 1L;
        };
        return value.multiply(BigDecimal.valueOf(factor)).setScale(0, java.math.RoundingMode.HALF_UP);
    }

    /** Text with price phrases removed, so a category name is matched on the words that describe the item. */
    private static String categoryPhrase(String text) {
        return AMOUNT.matcher(text).replaceAll(" ").replaceAll("\\s+", " ").trim();
    }

    private static String keyword(String text, String categoryName) {
        String cleaned = AMOUNT.matcher(text).replaceAll(" ");
        String categoryFolded = categoryName == null ? "" : TextSupport.fold(categoryName);
        return Stream.of(cleaned.split("[^a-z0-9]+"))
                .filter(w -> w.length() > 1 && !STOPWORDS.contains(w))
                .filter(w -> !categoryFolded.contains(w) || categoryFolded.isEmpty())
                .collect(Collectors.joining(" "));
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
