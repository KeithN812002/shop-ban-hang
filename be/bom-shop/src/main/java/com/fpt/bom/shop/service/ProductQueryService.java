package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CatalogDto.HomeResponse;
import com.fpt.bom.shop.dto.CatalogDto.ProductCard;
import com.fpt.bom.shop.dto.CatalogDto.ProductDetail;
import com.fpt.bom.shop.dto.CatalogDto.ProductSearchFilter;
import com.fpt.core.common.dto.PageResult;

import java.util.List;
import java.util.UUID;

/** Public, read-only product discovery (also the data source of the chatbot tools). */
public interface ProductQueryService {

    HomeResponse home();

    /** Search; the keyword is logged for trending keywords. */
    PageResult<ProductCard> search(ProductSearchFilter filter);

    /** Search without logging, used by internal callers (chatbot). */
    List<ProductCard> searchTop(ProductSearchFilter filter, int limit);

    List<String> suggest(String keyword);

    ProductDetail detail(UUID id);

    List<ProductCard> related(UUID id);

    /** Highest scored products of the last 7 days, optionally within a category subtree. */
    List<ProductCard> trending(UUID categoryId, int limit);

    List<ProductCard> bestSellers(UUID categoryId, int limit);

    /** Products with the largest percentage discount. */
    List<ProductCard> flashDeals(int limit);

    List<String> trendingKeywords(int limit);
}
