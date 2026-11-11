package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.StatsDto.AdminOverview;
import com.fpt.bom.shop.dto.StatsDto.AdminRevenuePoint;
import com.fpt.bom.shop.dto.StatsDto.SellerOverview;
import com.fpt.bom.shop.dto.StatsDto.SellerRevenuePoint;
import com.fpt.bom.shop.dto.StatsDto.ShipperStats;
import com.fpt.bom.shop.dto.StatsDto.StatsFilter;
import com.fpt.bom.shop.dto.StatsDto.TopCategory;
import com.fpt.bom.shop.dto.StatsDto.TopProduct;
import com.fpt.bom.shop.dto.StatsDto.TopStore;

import java.util.List;

/** Dashboard aggregates. Ranges default to the last 30 days; every query is scoped to the caller. */
public interface StatsService {

    SellerOverview sellerOverview(StatsFilter filter);

    List<SellerRevenuePoint> sellerRevenueChart(StatsFilter filter);

    List<TopProduct> sellerTopProducts(StatsFilter filter);

    ShipperStats shipperStats(StatsFilter filter);

    AdminOverview adminOverview(StatsFilter filter);

    List<AdminRevenuePoint> adminRevenueChart(StatsFilter filter);

    List<TopStore> adminTopStores(StatsFilter filter);

    List<TopProduct> adminTopProducts(StatsFilter filter);

    List<TopCategory> adminTopCategories(StatsFilter filter);
}
