package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants;
import com.fpt.bom.shop.dto.StatsDto.AdminOverview;
import com.fpt.bom.shop.dto.StatsDto.AdminRevenuePoint;
import com.fpt.bom.shop.dto.StatsDto.SellerOverview;
import com.fpt.bom.shop.dto.StatsDto.SellerRevenuePoint;
import com.fpt.bom.shop.dto.StatsDto.ShipperPoint;
import com.fpt.bom.shop.dto.StatsDto.ShipperStats;
import com.fpt.bom.shop.dto.StatsDto.StatsFilter;
import com.fpt.bom.shop.dto.StatsDto.TopCategory;
import com.fpt.bom.shop.dto.StatsDto.TopProduct;
import com.fpt.bom.shop.dto.StatsDto.TopStore;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.repository.ShipperRepository;
import com.fpt.bom.shop.repository.StatsRepository;
import com.fpt.bom.shop.repository.StatsRepository.RevenueRow;
import com.fpt.bom.shop.repository.StatsRepository.ShipperPointRow;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.StatsService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;
    /** Largest range a zero-filled chart is built for. */
    private static final int MAX_CHART_DAYS = 800;

    private final StatsRepository statsRepository;
    private final StoreRepository storeRepository;
    private final ShipperRepository shipperRepository;
    private final AccessSupport accessSupport;

    /** Resolved [from, to) range and chart granularity. */
    private record Range(LocalDate fromDate, LocalDate toDate, boolean monthly) {
        LocalDateTime start() {
            return fromDate.atStartOfDay();
        }

        LocalDateTime end() {
            return toDate.plusDays(1).atStartOfDay();
        }

        String unit() {
            return monthly ? "month" : "day";
        }

        String format() {
            return monthly ? "YYYY-MM" : "YYYY-MM-DD";
        }

        List<String> periods() {
            List<String> periods = new ArrayList<>();
            if (monthly) {
                for (YearMonth m = YearMonth.from(fromDate); !m.isAfter(YearMonth.from(toDate)); m = m.plusMonths(1)) {
                    periods.add(m.toString());
                }
            } else {
                for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
                    periods.add(d.toString());
                }
            }
            return periods;
        }
    }

    // ---- seller ----

    @Override
    @Transactional(readOnly = true)
    public SellerOverview sellerOverview(StatsFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Range range = range(filter);
        StatsRepository.SellerOverviewRow row = statsRepository.sellerOverview(store.getId(), range.start(),
                range.end());
        StatsRepository.ProductTotalsRow products = statsRepository.productTotals(store.getId());
        return new SellerOverview(nz(row.getRevenue()), nz(row.getOrderCount()), nz(row.getPendingCount()),
                nz(row.getToShipCount()), nz(row.getConfirmedCount()), nz(row.getReadyToShipCount()),
                nz(row.getCancelledCount()), nz(products.getProductCount()),
                store.getRatingAvg(), nz(products.getViewCount()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SellerRevenuePoint> sellerRevenueChart(StatsFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Range range = range(filter);
        Map<String, RevenueRow> rows = statsRepository.sellerRevenueChart(store.getId(), range.unit(),
                range.format(), range.start(), range.end()).stream()
                .collect(Collectors.toMap(RevenueRow::getPeriod, Function.identity()));
        return range.periods().stream().map(p -> {
            RevenueRow row = rows.get(p);
            return new SellerRevenuePoint(p, row != null ? nz(row.getRevenue()) : BigDecimal.ZERO,
                    row != null ? nz(row.getOrders()) : 0L);
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProduct> sellerTopProducts(StatsFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Range range = range(filter);
        return mapTopProducts(statsRepository.topProducts(store.getId(), range.start(), range.end(),
                limit(filter)));
    }

    // ---- shipper ----

    @Override
    @Transactional(readOnly = true)
    public ShipperStats shipperStats(StatsFilter filter) {
        String username = accessSupport.requireActiveShipper(accessSupport.currentUsername()).getUsername();
        Range range = range(filter);
        StatsRepository.ShipperRow totals = statsRepository.shipperTotals(username, range.start(), range.end());
        long failed = statsRepository.shipperFailed(username, range.start(), range.end());
        Map<String, ShipperPointRow> rows = statsRepository.shipperChart(username, range.unit(), range.format(),
                range.start(), range.end()).stream()
                .collect(Collectors.toMap(ShipperPointRow::getPeriod, Function.identity()));
        List<ShipperPoint> chart = range.periods().stream().map(p -> {
            ShipperPointRow row = rows.get(p);
            return new ShipperPoint(p, row != null ? nz(row.getEarnings()) : BigDecimal.ZERO,
                    row != null ? nz(row.getDeliveries()) : 0L);
        }).toList();
        return new ShipperStats(nz(totals.getDeliveredCount()), failed, nz(totals.getReturnedCount()),
                nz(totals.getCodCollected()), nz(totals.getEarnings()), chart);
    }

    // ---- admin ----

    @Override
    @Transactional(readOnly = true)
    public AdminOverview adminOverview(StatsFilter filter) {
        Range range = range(filter);
        StatsRepository.AdminOverviewRow row = statsRepository.adminOverview(range.start(), range.end());
        Map<String, Long> byStatus = new LinkedHashMap<>();
        statsRepository.ordersByStatus(range.start(), range.end())
                .forEach(r -> byStatus.put(r.getStatus(), nz(r.getTotal())));
        return new AdminOverview(nz(row.getGmv()), nz(row.getPlatformRevenue()), nz(row.getCompletedOrders()),
                nz(row.getCancelledOrders()), statsRepository.newUsers(range.start(), range.end()),
                storeRepository.countByStatusAndIsDeletedFalse(ApprovalStatus.ACTIVE),
                shipperRepository.countByStatus(ApprovalStatus.ACTIVE),
                storeRepository.countByStatusAndIsDeletedFalse(ApprovalStatus.PENDING),
                shipperRepository.countByStatus(ApprovalStatus.PENDING), byStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminRevenuePoint> adminRevenueChart(StatsFilter filter) {
        Range range = range(filter);
        Map<String, RevenueRow> rows = statsRepository.adminRevenueChart(range.unit(), range.format(),
                range.start(), range.end()).stream()
                .collect(Collectors.toMap(RevenueRow::getPeriod, Function.identity()));
        return range.periods().stream().map(p -> {
            RevenueRow row = rows.get(p);
            return new AdminRevenuePoint(p, row != null ? nz(row.getRevenue()) : BigDecimal.ZERO,
                    row != null ? nz(row.getPlatformRevenue()) : BigDecimal.ZERO,
                    row != null ? nz(row.getOrders()) : 0L);
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopStore> adminTopStores(StatsFilter filter) {
        Range range = range(filter);
        return statsRepository.topStores(range.start(), range.end(), limit(filter)).stream()
                .map(r -> new TopStore(r.getStoreId(), r.getName(), r.getLogoUrl(), nz(r.getOrders()),
                        nz(r.getGmv())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProduct> adminTopProducts(StatsFilter filter) {
        Range range = range(filter);
        return mapTopProducts(statsRepository.topProducts(null, range.start(), range.end(), limit(filter)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCategory> adminTopCategories(StatsFilter filter) {
        Range range = range(filter);
        return statsRepository.topCategories(range.start(), range.end(), limit(filter)).stream()
                .map(r -> new TopCategory(r.getCategoryId(), r.getName(), nz(r.getQuantity()), nz(r.getRevenue())))
                .toList();
    }

    private List<TopProduct> mapTopProducts(List<StatsRepository.TopProductRow> rows) {
        return rows.stream().map(r -> new TopProduct(r.getProductId(), r.getName(), r.getThumbnailUrl(),
                nz(r.getQuantity()), nz(r.getRevenue()))).toList();
    }

    private Range range(StatsFilter filter) {
        LocalDate to = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();
        LocalDate from = filter.getFromDate() != null ? filter.getFromDate()
                : to.minusDays(ShopConstants.DEFAULT_STATS_DAYS - 1L);
        if (from.isAfter(to) || from.plusDays(MAX_CHART_DAYS).isBefore(to)) {
            throw new BaseException("shop.stats.rangeInvalid");
        }
        return new Range(from, to, "MONTH".equalsIgnoreCase(filter.getGroupBy()));
    }

    private int limit(StatsFilter filter) {
        Integer requested = filter.getLimit();
        return requested == null ? DEFAULT_LIMIT : Math.max(1, Math.min(requested, MAX_LIMIT));
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static long nz(Long value) {
        return value == null ? 0L : value;
    }
}
