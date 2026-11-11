package com.fpt.bom.shop.service.support.chat;

import com.fpt.bom.shop.dto.CatalogDto.CategoryNode;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.CatalogDto.ProductSearchFilter;
import com.fpt.bom.shop.entity.Category;
import com.fpt.bom.shop.service.CategoryService;
import com.fpt.bom.shop.service.ProductQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * The catalogue tools exposed to the model (and reused by the rule-based fallback). Every tool reads the real
 * database through the public product services, so replies can only mention products that exist.
 */
@Component
@RequiredArgsConstructor
public class ShopChatTools {

    /** Tool output: the JSON handed back to the model plus the products it contains. */
    public record ToolResult(String json, List<ProductCard> products) {
    }

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_LIMIT = 10;

    private final ProductQueryService productQueryService;
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;

    /** Tool schemas in the Anthropic Messages API format. */
    public List<Map<String, Object>> definitions() {
        Map<String, Object> category = prop("string", "Tên danh mục (ví dụ: Điện thoại, Thời trang nam)");
        Map<String, Object> limit = prop("integer", "Số sản phẩm tối đa (1-10, mặc định 5)");
        List<Map<String, Object>> tools = new ArrayList<>();
        Map<String, Object> search = new LinkedHashMap<>();
        search.put("keyword", prop("string", "Từ khóa tên sản phẩm"));
        search.put("category", category);
        search.put("min_price", prop("number", "Giá tối thiểu (VND)"));
        search.put("max_price", prop("number", "Giá tối đa (VND)"));
        search.put("sort", prop("string",
                "relevance | newest | price_asc | price_desc | best_selling | popular"));
        search.put("limit", limit);
        tools.add(tool("search_products", "Tìm sản phẩm trong cửa hàng theo từ khóa, danh mục, khoảng giá.",
                search));
        tools.add(tool("get_trending_products", "Sản phẩm đang được quan tâm nhiều nhất trong 7 ngày qua.",
                Map.of("category", category, "limit", limit)));
        tools.add(tool("get_best_sellers", "Sản phẩm bán chạy nhất.", Map.of("category", category, "limit", limit)));
        tools.add(tool("get_flash_deals", "Sản phẩm đang giảm giá sâu nhất.", Map.of("limit", limit)));
        tools.add(tool("list_categories", "Danh sách danh mục sản phẩm của cửa hàng.", Map.of()));
        tools.add(tool("get_trending_keywords", "Các từ khóa tìm kiếm phổ biến gần đây.", Map.of()));
        return tools;
    }

    /** Runs a tool requested by the model; unknown tools and bad input yield an error JSON the model can read. */
    public ToolResult execute(String name, Map<String, Object> input) {
        Map<String, Object> args = input == null ? Map.of() : input;
        try {
            return switch (name) {
                case "search_products" -> products(searchProducts(str(args, "keyword"), str(args, "category"),
                        decimal(args, "min_price"), decimal(args, "max_price"), str(args, "sort"),
                        limit(args)));
                case "get_trending_products" -> categorized(str(args, "category"), limit(args), true);
                case "get_best_sellers" -> categorized(str(args, "category"), limit(args), false);
                case "get_flash_deals" -> products(flashDeals(limit(args)));
                case "list_categories" -> new ToolResult(json(flatten(categoryService.publicTree())), List.of());
                case "get_trending_keywords" -> new ToolResult(json(trendingKeywords()), List.of());
                default -> new ToolResult(json(Map.of("error", "unknown tool " + name)), List.of());
            };
        } catch (RuntimeException e) {
            return new ToolResult(json(Map.of("error", "tool failed")), List.of());
        }
    }

    // ---- typed operations (also used by the fallback engine) ----

    public List<ProductCard> searchProducts(String keyword, String categoryName, BigDecimal minPrice,
            BigDecimal maxPrice, String sort, int limit) {
        ProductSearchFilter filter = new ProductSearchFilter();
        filter.setKeyword(keyword);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setSort(sort);
        if (categoryName != null && !categoryName.isBlank()) {
            Optional<Category> category = categoryService.findActiveByName(categoryName);
            if (category.isEmpty()) {
                return List.of();
            }
            filter.setCategoryId(category.get().getId());
        }
        return productQueryService.searchTop(filter, clampLimit(limit));
    }

    public List<ProductCard> trending(String categoryName, int limit) {
        return productQueryService.trending(categoryId(categoryName), clampLimit(limit));
    }

    public List<ProductCard> bestSellers(String categoryName, int limit) {
        return productQueryService.bestSellers(categoryId(categoryName), clampLimit(limit));
    }

    public List<ProductCard> flashDeals(int limit) {
        return productQueryService.flashDeals(clampLimit(limit));
    }

    public List<String> trendingKeywords() {
        return productQueryService.trendingKeywords(10);
    }

    // ---- helpers ----

    private ToolResult categorized(String categoryName, int limit, boolean trending) {
        if (categoryName != null && !categoryName.isBlank() && categoryService.findActiveByName(categoryName).isEmpty()) {
            return new ToolResult(json(Map.of("products", List.of(), "note", "Không tìm thấy danh mục này")),
                    List.of());
        }
        return products(trending ? trending(categoryName, limit) : bestSellers(categoryName, limit));
    }

    private UUID categoryId(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return null;
        }
        // An unknown category must not silently widen to the whole catalogue.
        return categoryService.findActiveByName(categoryName).map(Category::getId)
                .orElse(new UUID(0L, 0L));
    }

    private ToolResult products(List<ProductCard> cards) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductCard card : cards) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", card.id().toString());
            row.put("name", card.name());
            row.put("price_vnd", card.price());
            row.put("original_price_vnd", card.originalPrice());
            row.put("discount_percent", card.discountPercent());
            row.put("rating", card.ratingAvg());
            row.put("sold", card.soldCount());
            row.put("store", card.storeName());
            rows.add(row);
        }
        return new ToolResult(json(Map.of("products", rows)), cards);
    }

    private List<Map<String, Object>> flatten(List<CategoryNode> nodes) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CategoryNode node : nodes) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", node.name());
            if (!node.children().isEmpty()) {
                row.put("children", flatten(node.children()));
            }
            rows.add(row);
        }
        return rows;
    }

    private String json(Object value) {
        return objectMapper.writeValueAsString(value);
    }

    private static Map<String, Object> prop(String type, String description) {
        Map<String, Object> property = new LinkedHashMap<>();
        property.put("type", type);
        property.put("description", description);
        return property;
    }

    private static Map<String, Object> tool(String name, String description, Map<String, Object> properties) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        Map<String, Object> tool = new LinkedHashMap<>();
        tool.put("name", name);
        tool.put("description", description);
        tool.put("input_schema", schema);
        return tool;
    }

    private static int clampLimit(int limit) {
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }

    private static int limit(Map<String, Object> args) {
        Object value = args.get("limit");
        return value instanceof Number n ? clampLimit(n.intValue()) : DEFAULT_LIMIT;
    }

    private static String str(Map<String, Object> args, String key) {
        Object value = args.get(key);
        return value instanceof String s && !s.isBlank() ? s.trim() : null;
    }

    private static BigDecimal decimal(Map<String, Object> args, String key) {
        Object value = args.get(key);
        return value instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null;
    }
}
