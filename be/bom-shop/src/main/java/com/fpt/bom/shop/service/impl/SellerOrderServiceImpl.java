package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.OrderDto.OrderDetailResponse;
import com.fpt.bom.shop.dto.OrderDto.OrderFilter;
import com.fpt.bom.shop.dto.OrderDto.OrderResponse;
import com.fpt.bom.shop.dto.ReturnDto.RefundRequest;
import com.fpt.bom.shop.dto.ReturnDto.ReturnApproveRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.service.SellerOrderService;
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
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Service
@RequiredArgsConstructor
public class SellerOrderServiceImpl implements SellerOrderService {

    private final OrderRepository orderRepository;
    private final OrderTransitions orderTransitions;
    private final OrderAssembler orderAssembler;
    private final AccessSupport accessSupport;
    private final ReturnSupport returnSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<OrderResponse> search(OrderFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        // The store filter of the shared builder is overridden by the caller's own store.
        filter.setStoreId(null);
        SpecificationBuilder<ShopOrder> builder = OrderSpecs.fromFilter(filter);
        builder.and(eq("storeId", store.getId()));
        Page<ShopOrder> page = orderRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));
        return new PageResult<>(orderAssembler.toResponses(page.getContent()), page.getTotalElements(),
                page.getTotalPages(), page.getNumber() + 1, page.getSize());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse detail(UUID id) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        ShopOrder order = orderRepository.findByIdAndStoreId(Objects.requireNonNull(id), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        return orderAssembler.toDetail(order, Viewer.SELLER);
    }

    @Override
    @Transactional
    public void confirm(ReasonRequest request) {
        String username = accessSupport.currentUsername();
        ShopOrder order = lockOwned(request.id(), username);
        orderTransitions.apply(order, OrderStatus.CONFIRMED, Action.CONFIRM, ActorSource.SELLER, username,
                request.reason());
    }

    @Override
    @Transactional
    public void readyToShip(ReasonRequest request) {
        String username = accessSupport.currentUsername();
        ShopOrder order = lockOwned(request.id(), username);
        orderTransitions.apply(order, OrderStatus.READY_TO_SHIP, Action.READY_TO_SHIP, ActorSource.SELLER,
                username, request.reason());
    }

    @Override
    @Transactional
    public void cancel(ReasonRequest request) {
        String username = accessSupport.currentUsername();
        String reason = TextSupport.blankToNull(request.reason());
        if (reason == null) {
            throw new BaseException("shop.order.reasonRequired");
        }
        ShopOrder order = lockOwned(request.id(), username);
        order.setCancelReason(reason);
        orderTransitions.apply(order, OrderStatus.CANCELLED, Action.CANCEL, ActorSource.SELLER, username, reason);
    }

    @Override
    @Transactional
    public void confirmReturned(UUIDRequest request) {
        String username = accessSupport.currentUsername();
        ShopOrder order = lockOwned(request.getId(), username);
        orderTransitions.apply(order, OrderStatus.RETURNED, Action.RETURN_RECEIVED, ActorSource.SELLER, username,
                null);
    }

    @Override
    @Transactional
    public void approveReturn(ReturnApproveRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.approve(lockOwned(request.id(), username), request.note(), username);
    }

    @Override
    @Transactional
    public void rejectReturn(ReasonRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.reject(lockOwned(request.id(), username), request.reason(), username);
    }

    @Override
    @Transactional
    public void confirmReturnReceived(UUIDRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.confirmGoodsReceived(lockOwned(request.getId(), username), username);
    }

    @Override
    @Transactional
    public void markRefunded(RefundRequest request) {
        String username = accessSupport.currentUsername();
        returnSupport.markRefunded(lockOwned(request.id(), username), request.proofImageUrl(), request.note(),
                ActorSource.SELLER, username);
    }

    /** Locks the order and checks it belongs to the caller's store (ownership comes from the token, not the body). */
    private ShopOrder lockOwned(UUID id, String username) {
        Store store = accessSupport.requireActiveStore(username);
        ShopOrder order = orderTransitions.lock(Objects.requireNonNull(id));
        if (!order.getStoreId().equals(store.getId())) {
            throw new BaseException("APP_DATA404");
        }
        return order;
    }
}
