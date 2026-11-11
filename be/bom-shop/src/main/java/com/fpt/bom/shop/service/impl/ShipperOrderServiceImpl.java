package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants;
import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.DeliveredRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.service.ShipperOrderService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.OrderAssembler;
import com.fpt.bom.shop.service.support.OrderAssembler.Viewer;
import com.fpt.bom.shop.service.support.OrderSpecs;
import com.fpt.bom.shop.service.support.OrderTransitions;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShipperOrderServiceImpl implements ShipperOrderService {

    private static final List<OrderStatus> MY_DEFAULT_STATUSES = List.of(OrderStatus.PICKING,
            OrderStatus.SHIPPING, OrderStatus.RETURNING, OrderStatus.DELIVERED, OrderStatus.RETURNED,
            OrderStatus.RETURN_SHIPPING);

    private final OrderRepository orderRepository;
    private final OrderTransitions orderTransitions;
    private final OrderAssembler orderAssembler;
    private final AccessSupport accessSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<OrderResponse> available(OrderFilter filter) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        String province = TextSupport.blankToNull(filter.getProvince());
        if (Boolean.TRUE.equals(filter.getAllProvinces())) {
            province = null;
        } else if (province == null) {
            province = shipper.getAreaProvince();
        }
        SpecificationBuilder<ShopOrder> builder = new SpecificationBuilder<>();
        builder.and(OrderSpecs.availableJobs(filter.getType()));
        builder.and(OrderSpecs.provinceEquals(province));
        builder.and(OrderSpecs.keyword(filter.getKeyword()));
        return page(builder, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<OrderResponse> mine(OrderFilter filter) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        SpecificationBuilder<ShopOrder> builder = new SpecificationBuilder<>();
        builder.and(OrderSpecs.assignedTo(shipper.getUsername(), filter.getStatus() != null
                && !filter.getStatus().isEmpty() ? filter.getStatus() : MY_DEFAULT_STATUSES));
        builder.and(OrderSpecs.keyword(filter.getKeyword()));
        return page(builder, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse detail(UUID id) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        ShopOrder order = orderRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        boolean assignedToMe = shipper.getUsername().equals(order.getShipperUsername());
        boolean returning = shipper.getUsername().equals(order.getReturnShipperUsername());
        boolean available = order.getStatus() == OrderStatus.READY_TO_SHIP && order.getShipperUsername() == null
                || order.getStatus() == OrderStatus.RETURN_APPROVED && order.getReturnShipperUsername() == null;
        if (!assignedToMe && !returning && !available) {
            throw new BaseException("APP_DATA404");
        }
        return orderAssembler.toDetail(order, Viewer.SHIPPER);
    }

    @Override
    @Transactional
    public void accept(UUID id) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        // The row lock serializes concurrent shippers; the loser sees the order already taken.
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(id));
        if (order.getStatus() == OrderStatus.RETURN_APPROVED && order.getReturnShipperUsername() == null) {
            order.setReturnShipperUsername(shipper.getUsername());
            orderTransitions.apply(order, OrderStatus.RETURN_SHIPPING, Action.RETURN_ACCEPT, ActorSource.SHIPPER,
                    shipper.getUsername(), null);
            return;
        }
        if (order.getStatus() != OrderStatus.READY_TO_SHIP || order.getShipperUsername() != null) {
            throw new BaseException("shop.order.alreadyTaken");
        }
        order.setShipperUsername(shipper.getUsername());
        orderTransitions.apply(order, OrderStatus.PICKING, Action.ACCEPT, ActorSource.SHIPPER,
                shipper.getUsername(), null);
    }

    @Override
    @Transactional
    public void pickedUp(UUID id) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        ShopOrder order = lockAssigned(id, shipper);
        orderTransitions.apply(order, OrderStatus.SHIPPING, Action.PICKED_UP, ActorSource.SHIPPER,
                shipper.getUsername(), null);
    }

    @Override
    @Transactional
    public void delivered(DeliveredRequest request) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        ShopOrder order = lockAssigned(request.id(), shipper);
        order.setDeliveryProofUrl(TextSupport.fileUrl(request.proofImageUrl()));
        orderTransitions.apply(order, OrderStatus.DELIVERED, Action.DELIVERED, ActorSource.SHIPPER,
                shipper.getUsername(), null);
    }

    @Override
    @Transactional
    public void failed(ReasonRequest request) {
        Shipper shipper = accessSupport.requireActiveShipper(accessSupport.currentUsername());
        String reason = TextSupport.blankToNull(request.reason());
        if (reason == null) {
            throw new BaseException("shop.order.reasonRequired");
        }
        ShopOrder order = lockAssigned(request.id(), shipper);
        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new BaseException("shop.order.invalidTransition");
        }
        order.setFailedAttempts(order.getFailedAttempts() + 1);
        if (order.getFailedAttempts() >= ShopConstants.MAX_FAILED_DELIVERY_ATTEMPTS) {
            orderTransitions.apply(order, OrderStatus.RETURNING, Action.RETURNING, ActorSource.SHIPPER,
                    shipper.getUsername(), reason);
            return;
        }
        orderRepository.saveAndFlush(order);
        orderTransitions.recordEvent(order, Action.DELIVERY_FAILED, ActorSource.SHIPPER, shipper.getUsername(),
                reason);
        orderTransitions.notifyBuyer(order, "shop.notify.order.failed", reason,
                "/account/orders/" + order.getId(), order.getCode(), order.getFailedAttempts());
        log.info("Delivery attempt failed: order={}, attempts={}", order.getId(), order.getFailedAttempts());
    }

    private ShopOrder lockAssigned(UUID id, Shipper shipper) {
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(id));
        if (!shipper.getUsername().equals(order.getShipperUsername())) {
            throw new BaseException("APP_DATA404");
        }
        return order;
    }

    private PageResult<OrderResponse> page(SpecificationBuilder<ShopOrder> builder, OrderFilter filter) {
        Page<ShopOrder> page = orderRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return new PageResult<>(orderAssembler.toResponses(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }
}
