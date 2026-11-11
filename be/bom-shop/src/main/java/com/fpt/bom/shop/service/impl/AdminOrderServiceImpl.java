package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnResolveRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.service.AdminOrderService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.OrderAssembler;
import com.fpt.bom.shop.service.support.OrderAssembler.Viewer;
import com.fpt.bom.shop.service.support.OrderSpecs;
import com.fpt.bom.shop.service.support.OrderTransitions;
import com.fpt.bom.shop.service.support.ReturnSupport;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.dto.UUIDRequest;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderTransitions orderTransitions;
    private final OrderAssembler orderAssembler;
    private final AccessSupport accessSupport;
    private final ReturnSupport returnSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<OrderResponse> search(OrderFilter filter) {
        Page<ShopOrder> page = orderRepository.findAll(OrderSpecs.fromFilter(filter).build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return new PageResult<>(orderAssembler.toResponses(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse detail(UUID id) {
        ShopOrder order = orderRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        return orderAssembler.toDetail(order, Viewer.ADMIN);
    }

    @Override
    @Transactional
    public void cancel(ReasonRequest request) {
        String reason = TextSupport.blankToNull(request.reason());
        if (reason == null) {
            throw new BaseException("shop.order.reasonRequired");
        }
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(request.id()));
        order.setCancelReason(reason);
        orderTransitions.apply(order, OrderStatus.CANCELLED, Action.CANCEL, ActorSource.ADMIN,
                accessSupport.currentUsername(), reason);
    }

    @Override
    @Transactional
    public void confirmReturned(UUIDRequest request) {
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(request.getId()));
        orderTransitions.apply(order, OrderStatus.RETURNED, Action.RETURN_RECEIVED, ActorSource.ADMIN,
                accessSupport.currentUsername(), null);
    }

    @Override
    @Transactional
    public void resolveReturn(ReturnResolveRequest request) {
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(request.id()));
        returnSupport.resolve(order, Boolean.TRUE.equals(request.approve()), request.note(),
                accessSupport.currentUsername());
    }

    @Override
    @Transactional
    public void markRefunded(RefundRequest request) {
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(request.id()));
        returnSupport.markRefunded(order, request.proofImageUrl(), request.note(), ActorSource.ADMIN,
                accessSupport.currentUsername());
    }
}
