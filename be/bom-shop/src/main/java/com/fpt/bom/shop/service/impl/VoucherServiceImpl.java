package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.VoucherDto.VoucherFilter;
import com.fpt.bom.shop.dto.VoucherDto.VoucherRequest;
import com.fpt.bom.shop.dto.VoucherDto.VoucherResponse;
import com.fpt.bom.shop.entity.Voucher;
import com.fpt.bom.shop.enums.DiscountType;
import com.fpt.bom.shop.repository.VoucherRepository;
import com.fpt.bom.shop.service.VoucherService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.bom.shop.service.support.VoucherSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final VoucherRepository voucherRepository;
    private final VoucherSupport voucherSupport;
    private final AccessSupport accessSupport;
    private final ShopMapper shopMapper;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> available(UUID storeId) {
        String username = accessSupport.currentUsername();
        LocalDateTime now = LocalDateTime.now();
        Specification<Voucher> scope = (root, query, cb) -> storeId == null
                ? cb.isNull(root.get("storeId"))
                : cb.or(cb.isNull(root.get("storeId")), cb.equal(root.get("storeId"), storeId));
        SpecificationBuilder<Voucher> builder = new SpecificationBuilder<>();
        builder.and(scope);
        builder.and(eq("status", StatusBasic.ACTIVE));
        builder.and((root, query, cb) -> cb.and(cb.lessThanOrEqualTo(root.get("startAt"), now),
                cb.greaterThanOrEqualTo(root.get("endAt"), now)));
        return voucherRepository.findAll(builder.build(),
                        PageableUtils.pageable(0, 100, "endAt:ASC")).getContent().stream()
                .filter(v -> voucherSupport.isUsable(v, username))
                .map(shopMapper::toVoucher).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<VoucherResponse> search(boolean seller, VoucherFilter filter) {
        UUID ownerStoreId = ownerStoreId(seller);
        SpecificationBuilder<Voucher> builder = new SpecificationBuilder<>();
        builder.and(ownerStoreId == null
                ? (Specification<Voucher>) (root, query, cb) -> cb.isNull(root.get("storeId"))
                : eq("storeId", ownerStoreId));
        builder.and(eq("status", filter.getStatus()));
        builder.and(keyword(filter.getKeyword()));
        Page<Voucher> page = voucherRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return PageableUtils.toPageResult(page, shopMapper::toVoucher);
    }

    @Override
    @Transactional
    public VoucherResponse create(boolean seller, VoucherRequest request) {
        UUID ownerStoreId = ownerStoreId(seller);
        String code = normalizeCode(request.code());
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new BaseException("shop.voucher.codeExists");
        }
        validate(request);
        Voucher voucher = new Voucher();
        voucher.setStoreId(ownerStoreId);
        voucher.setCode(code);
        voucher.setUsedCount(0);
        apply(voucher, request);
        voucherRepository.save(voucher);
        log.info("Voucher created: id={}, code={}, store={}", voucher.getId(), code, ownerStoreId);
        return shopMapper.toVoucher(voucher);
    }

    @Override
    @Transactional
    public VoucherResponse update(boolean seller, VoucherRequest request) {
        UUID ownerStoreId = ownerStoreId(seller);
        Voucher voucher = requireScoped(request.id(), ownerStoreId);
        String code = normalizeCode(request.code());
        if (!voucher.getCode().equalsIgnoreCase(code)) {
            if (voucher.getUsedCount() > 0) {
                throw new BaseException("shop.voucher.codeLocked");
            }
            if (voucherRepository.existsByCodeIgnoreCase(code)) {
                throw new BaseException("shop.voucher.codeExists");
            }
            voucher.setCode(code);
        }
        validate(request);
        apply(voucher, request);
        voucherRepository.save(voucher);
        log.info("Voucher updated: id={}", voucher.getId());
        return shopMapper.toVoucher(voucher);
    }

    @Override
    @Transactional
    public void delete(boolean seller, UUID id) {
        UUID ownerStoreId = ownerStoreId(seller);
        Voucher voucher = requireScoped(id, ownerStoreId);
        if (voucher.getUsedCount() > 0) {
            voucher.setStatus(StatusBasic.INACTIVE);
            voucherRepository.save(voucher);
            log.info("Used voucher deactivated instead of deleted: id={}", id);
            return;
        }
        voucherRepository.delete(voucher);
        log.info("Voucher deleted: id={}", id);
    }

    /** The caller's own ACTIVE store for sellers; null (platform vouchers) for the admin endpoints. */
    private UUID ownerStoreId(boolean seller) {
        return seller ? accessSupport.requireActiveStore(accessSupport.currentUsername()).getId() : null;
    }

    private Voucher requireScoped(UUID id, UUID ownerStoreId) {
        Voucher voucher = voucherRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (!Objects.equals(voucher.getStoreId(), ownerStoreId)) {
            throw new BaseException("APP_DATA404");
        }
        return voucher;
    }

    private void validate(VoucherRequest request) {
        if (!request.endAt().isAfter(request.startAt())) {
            throw new BaseException("shop.voucher.periodInvalid");
        }
        if (request.discountType() == DiscountType.PERCENT && request.discountValue().compareTo(HUNDRED) > 0) {
            throw new BaseException("shop.voucher.percentInvalid");
        }
        if ((request.usageLimit() != null && request.usageLimit() < 0)
                || (request.perUserLimit() != null && request.perUserLimit() < 0)) {
            throw new BaseException("shop.voucher.limitInvalid");
        }
    }

    private void apply(Voucher voucher, VoucherRequest request) {
        voucher.setName(request.name().trim());
        voucher.setDiscountType(request.discountType());
        voucher.setDiscountValue(request.discountValue());
        voucher.setMaxDiscount(request.discountType() == DiscountType.PERCENT ? request.maxDiscount() : null);
        voucher.setMinOrderValue(request.minOrderValue());
        voucher.setStartAt(request.startAt());
        voucher.setEndAt(request.endAt());
        voucher.setUsageLimit(request.usageLimit() != null && request.usageLimit() > 0 ? request.usageLimit() : null);
        voucher.setPerUserLimit(
                request.perUserLimit() != null && request.perUserLimit() > 0 ? request.perUserLimit() : null);
        voucher.setStatus(request.status() != null ? request.status() : StatusBasic.ACTIVE);
    }

    private static String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private Specification<Voucher> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            return cb.or(cb.like(cb.lower(root.get("code")), pattern, '\\'),
                    cb.like(cb.lower(root.get("name")), pattern, '\\'));
        };
    }
}
