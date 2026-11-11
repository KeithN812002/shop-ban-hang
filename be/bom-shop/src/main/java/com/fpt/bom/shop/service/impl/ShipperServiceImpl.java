package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.AccountDto.ShipperRegisterRequest;
import com.fpt.bom.shop.dto.AccountDto.ShipperResponse;
import com.fpt.bom.shop.dto.AdminDto.ApprovalFilter;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.repository.ShipperRepository;
import com.fpt.bom.shop.service.ShipperService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.NotificationSupport;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShipperServiceImpl implements ShipperService {

    private static final String SHIPPER_LINK = "/shipper";

    private final ShipperRepository shipperRepository;
    private final AccessSupport accessSupport;
    private final NotificationSupport notificationSupport;

    @Override
    @Transactional
    public void register(ShipperRegisterRequest request) {
        String username = accessSupport.currentUsername();
        Optional<Shipper> existing = shipperRepository.findByUsername(username);
        Shipper shipper;
        if (existing.isPresent()) {
            shipper = existing.get();
            if (shipper.getStatus() != ApprovalStatus.REJECTED) {
                throw new BaseException("shop.shipper.alreadyRegistered");
            }
        } else {
            shipper = new Shipper();
            shipper.setUsername(username);
        }
        shipper.setFullName(request.fullName().trim());
        shipper.setPhone(request.phone().trim());
        shipper.setIdNumber(request.idNumber().trim());
        shipper.setVehicleType(TextSupport.blankToNull(request.vehicleType()));
        shipper.setVehiclePlate(TextSupport.blankToNull(request.vehiclePlate()));
        shipper.setAreaProvince(request.areaProvince().trim());
        shipper.setStatus(ApprovalStatus.PENDING);
        shipper.setRejectReason(null);
        shipperRepository.save(shipper);
        log.info("Shipper registration submitted: id={}, user={}", shipper.getId(), username);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipperResponse profile() {
        return shipperRepository.findByUsername(accessSupport.currentUsername()).map(this::toResponse)
                .orElseThrow(() -> new BaseException("shop.shipper.notFound"));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<ShipperResponse> adminSearch(ApprovalFilter filter) {
        SpecificationBuilder<Shipper> builder = new SpecificationBuilder<>();
        builder.and(eq("status", filter.getStatus()));
        builder.and(keyword(filter.getKeyword()));
        Pageable pageable = PageableUtils.pageable(filter);
        Page<Shipper> page = shipperRepository.findAll(builder.build(), pageable);
        return PageableUtils.toPageResult(page, this::toResponse);
    }

    @Override
    @Transactional
    public void approve(ReasonRequest request) {
        Shipper shipper = require(request.id(), Set.of(ApprovalStatus.PENDING, ApprovalStatus.REJECTED));
        shipper.setStatus(ApprovalStatus.ACTIVE);
        shipper.setRejectReason(null);
        shipperRepository.save(shipper);
        notificationSupport.send(shipper.getUsername(), NotificationType.SYSTEM, "shop.notify.shipper.approved",
                null, SHIPPER_LINK);
        log.info("Shipper approved: id={}", shipper.getId());
    }

    @Override
    @Transactional
    public void reject(ReasonRequest request) {
        Shipper shipper = require(request.id(), Set.of(ApprovalStatus.PENDING));
        shipper.setStatus(ApprovalStatus.REJECTED);
        shipper.setRejectReason(TextSupport.blankToNull(request.reason()));
        shipperRepository.save(shipper);
        notificationSupport.send(shipper.getUsername(), NotificationType.SYSTEM, "shop.notify.shipper.rejected",
                shipper.getRejectReason(), SHIPPER_LINK);
        log.info("Shipper rejected: id={}", shipper.getId());
    }

    @Override
    @Transactional
    public void suspend(ReasonRequest request) {
        Shipper shipper = require(request.id(), Set.of(ApprovalStatus.ACTIVE));
        shipper.setStatus(ApprovalStatus.SUSPENDED);
        shipper.setRejectReason(TextSupport.blankToNull(request.reason()));
        shipperRepository.save(shipper);
        notificationSupport.send(shipper.getUsername(), NotificationType.SYSTEM,
                "shop.notify.shipper.suspended", shipper.getRejectReason(), SHIPPER_LINK);
        log.info("Shipper suspended: id={}", shipper.getId());
    }

    @Override
    @Transactional
    public void reactivate(ReasonRequest request) {
        Shipper shipper = require(request.id(), Set.of(ApprovalStatus.SUSPENDED));
        shipper.setStatus(ApprovalStatus.ACTIVE);
        shipper.setRejectReason(null);
        shipperRepository.save(shipper);
        notificationSupport.send(shipper.getUsername(), NotificationType.SYSTEM,
                "shop.notify.shipper.reactivated", null, SHIPPER_LINK);
        log.info("Shipper reactivated: id={}", shipper.getId());
    }

    private Shipper require(UUID id, Set<ApprovalStatus> allowedFrom) {
        Shipper shipper = shipperRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (!allowedFrom.contains(shipper.getStatus())) {
            throw new BaseException("shop.shipper.invalidTransition");
        }
        return shipper;
    }

    private Specification<Shipper> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            return cb.or(cb.like(cb.lower(root.get("fullName")), pattern, '\\'),
                    cb.like(cb.lower(root.get("username")), pattern, '\\'),
                    cb.like(cb.lower(root.get("phone")), pattern, '\\'));
        };
    }

    private ShipperResponse toResponse(Shipper s) {
        return new ShipperResponse(s.getId(), s.getUsername(), s.getFullName(), s.getPhone(), s.getIdNumber(),
                s.getVehicleType(), s.getVehiclePlate(), s.getAreaProvince(), s.getStatus(), s.getRejectReason());
    }
}
