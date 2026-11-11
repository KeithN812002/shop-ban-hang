package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.constant.ShopConstants.Action;
import com.fpt.bom.shop.dto.ReturnDto.ReturnCreateRequest;
import com.fpt.bom.shop.entity.ReturnRequest;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.enums.ActorSource;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.enums.ReturnRequestStatus;
import com.fpt.bom.shop.repository.ReturnRequestRepository;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Behaviour of the buyer return flow (docs/shop-contract.md section 12), shared by the buyer, seller, admin and the
 * scheduled timeouts. Callers authorize the actor and hold the order row lock ({@code OrderTransitions.lock});
 * every method runs in the caller's transaction.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReturnSupport {

    private static final String BUYER_LINK = "/account/orders/";

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderTransitions orderTransitions;
    private final ShopProperties shopProperties;

    /** DELIVERED -> RETURN_REQUESTED: validates the window, images and bank details, then stores the request. */
    public void request(ShopOrder order, ReturnCreateRequest request, String username) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BaseException("shop.return.notAllowed");
        }
        if (!ReturnRules.canRequestReturn(order, shopProperties.getOrder(), LocalDateTime.now())) {
            throw new BaseException("shop.return.windowExpired");
        }
        List<String> images = ReturnRules.validImages(request.imageUrls());
        String[] bank = ReturnRules.validBank(request);
        if (returnRequestRepository.findByOrderId(order.getId()).isPresent()) {
            throw new BaseException("shop.return.notAllowed");
        }
        String description = TextSupport.blankToNull(request.description());

        ReturnRequest entity = new ReturnRequest();
        entity.setOrderId(order.getId());
        entity.setBuyerUsername(username);
        entity.setReasonCode(request.reasonCode());
        entity.setDescription(description);
        entity.setImageUrls(TextSupport.joinCsv(images));
        entity.setBankName(bank[0]);
        entity.setBankAccountNo(bank[1]);
        entity.setBankAccountName(bank[2]);
        entity.setRefundAmount(order.getTotal());
        entity.setStatus(ReturnRequestStatus.REQUESTED);
        entity.setRequestedAt(LocalDateTime.now());
        returnRequestRepository.save(entity);

        String note = request.reasonCode().getLabel() + (description == null ? "" : ": " + description);
        orderTransitions.apply(order, OrderStatus.RETURN_REQUESTED, Action.RETURN_REQUEST, ActorSource.BUYER,
                username, note);
    }

    /** Seller accepts the return (REQUESTED -> APPROVED, order RETURN_APPROVED). */
    public void approve(ShopOrder order, String note, String actor) {
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.REQUESTED);
        request.setStatus(ReturnRequestStatus.APPROVED);
        request.setSellerNote(TextSupport.truncate(TextSupport.blankToNull(note), 500));
        request.setRespondedAt(LocalDateTime.now());
        returnRequestRepository.save(request);
        orderTransitions.apply(order, OrderStatus.RETURN_APPROVED, Action.RETURN_APPROVE, ActorSource.SELLER, actor,
                request.getSellerNote());
    }

    /** Seller rejects (REQUESTED -> REJECTED); the order stays RETURN_REQUESTED and the buyer may dispute. */
    public void reject(ShopOrder order, String reason, String actor) {
        String text = requireText(reason);
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.REQUESTED);
        request.setStatus(ReturnRequestStatus.REJECTED);
        request.setSellerNote(text);
        request.setRespondedAt(LocalDateTime.now());
        returnRequestRepository.save(request);
        orderTransitions.recordEvent(order, Action.RETURN_REJECT, ActorSource.SELLER, actor, text);
        orderTransitions.notifyBuyer(order, "shop.notify.return.rejected", text, BUYER_LINK + order.getId(),
                order.getCode(), shopProperties.getOrder().getReturnDisputeDays());
    }

    /** Buyer disputes a rejection within the dispute window (REJECTED -> DISPUTED). */
    public void dispute(ShopOrder order, String reason, String username) {
        String text = requireText(reason);
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.REJECTED);
        LocalDateTime deadline = ReturnRules.disputeDeadline(request, shopProperties.getOrder());
        if (deadline == null || LocalDateTime.now().isAfter(deadline)) {
            throw new BaseException("shop.return.disputeExpired");
        }
        request.setStatus(ReturnRequestStatus.DISPUTED);
        request.setDisputeReason(text);
        request.setDisputedAt(LocalDateTime.now());
        returnRequestRepository.save(request);
        orderTransitions.recordEvent(order, Action.RETURN_DISPUTE, ActorSource.BUYER, username, text);
        orderTransitions.notifyStoreOwner(order, "shop.notify.return.disputed.seller", text, order.getCode());
    }

    /** Buyer withdraws while REQUESTED or REJECTED; the order completes normally. */
    public void withdraw(ShopOrder order, String username) {
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.REQUESTED, ReturnRequestStatus.REJECTED);
        request.setStatus(ReturnRequestStatus.CANCELLED);
        returnRequestRepository.save(request);
        orderTransitions.apply(order, OrderStatus.COMPLETED, Action.RETURN_WITHDRAW, ActorSource.BUYER, username,
                null);
    }

    /** Admin decision on a DISPUTED request: approve (order RETURN_APPROVED) or reject (order COMPLETED). */
    public void resolve(ShopOrder order, boolean approve, String note, String actor) {
        String text = requireText(note);
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.DISPUTED);
        request.setAdminNote(text);
        request.setResolvedAt(LocalDateTime.now());
        if (approve) {
            request.setStatus(ReturnRequestStatus.APPROVED);
            returnRequestRepository.save(request);
            orderTransitions.apply(order, OrderStatus.RETURN_APPROVED, Action.RETURN_RESOLVE_APPROVE,
                    ActorSource.ADMIN, actor, text);
        } else {
            request.setStatus(ReturnRequestStatus.CLOSED);
            returnRequestRepository.save(request);
            orderTransitions.apply(order, OrderStatus.COMPLETED, Action.RETURN_RESOLVE_REJECT, ActorSource.ADMIN,
                    actor, text);
        }
    }

    /** RETURN_SHIPPING -> RETURN_RECEIVED; restores stock. */
    public void confirmGoodsReceived(ShopOrder order, String actor) {
        orderTransitions.apply(order, OrderStatus.RETURN_RECEIVED, Action.RETURN_GOODS_RECEIVED, ActorSource.SELLER,
                actor, null);
    }

    /** RETURN_RECEIVED -> REFUNDED: records the manual bank transfer; fees are settled by the transition. */
    public void markRefunded(ShopOrder order, String proofImageUrl, String note, ActorSource source, String actor) {
        ReturnRequest request = requireRequest(order, ReturnRequestStatus.APPROVED);
        if (order.getStatus() != OrderStatus.RETURN_RECEIVED) {
            throw new BaseException("shop.order.invalidTransition");
        }
        request.setRefundProofUrl(TextSupport.fileUrl(proofImageUrl));
        request.setRefundNote(TextSupport.truncate(TextSupport.blankToNull(note), 500));
        request.setRefundedAt(LocalDateTime.now());
        request.setRefundedBy(TextSupport.truncate(actor, 50));
        returnRequestRepository.save(request);
        orderTransitions.apply(order, OrderStatus.REFUNDED, Action.REFUND, source, actor, request.getRefundNote());
    }

    /** Timeout: the seller never answered within {@code return-response-days}. */
    @Transactional
    public void autoApprove(UUID orderId) {
        ShopOrder order = orderTransitions.lock(orderId);
        ReturnRequest request = returnRequestRepository.findByOrderId(orderId).orElse(null);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(shopProperties.getOrder().getReturnResponseDays());
        if (order.getStatus() != OrderStatus.RETURN_REQUESTED || request == null
                || request.getStatus() != ReturnRequestStatus.REQUESTED
                || !request.getRequestedAt().isBefore(cutoff)) {
            return;
        }
        request.setStatus(ReturnRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());
        returnRequestRepository.save(request);
        orderTransitions.apply(order, OrderStatus.RETURN_APPROVED, Action.RETURN_AUTO_APPROVE, ActorSource.SYSTEM,
                "system", null);
    }

    /** Timeout: the buyer did not dispute a rejection within {@code return-dispute-days}; the order completes. */
    @Transactional
    public void autoClose(UUID orderId) {
        ShopOrder order = orderTransitions.lock(orderId);
        ReturnRequest request = returnRequestRepository.findByOrderId(orderId).orElse(null);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(shopProperties.getOrder().getReturnDisputeDays());
        if (order.getStatus() != OrderStatus.RETURN_REQUESTED || request == null
                || request.getStatus() != ReturnRequestStatus.REJECTED || request.getRespondedAt() == null
                || !request.getRespondedAt().isBefore(cutoff)) {
            return;
        }
        request.setStatus(ReturnRequestStatus.CLOSED);
        returnRequestRepository.save(request);
        orderTransitions.apply(order, OrderStatus.COMPLETED, Action.RETURN_AUTO_CLOSE, ActorSource.SYSTEM, "system",
                null);
    }

    /** Order ids with a REQUESTED request older than the response window. */
    public List<UUID> overdueForApproval() {
        return returnRequestRepository.findOrderIdsRequestedBefore(ReturnRequestStatus.REQUESTED,
                LocalDateTime.now().minusDays(shopProperties.getOrder().getReturnResponseDays()));
    }

    /** Order ids with a REJECTED request older than the dispute window. */
    public List<UUID> overdueForClosing() {
        return returnRequestRepository.findOrderIdsRespondedBefore(ReturnRequestStatus.REJECTED,
                LocalDateTime.now().minusDays(shopProperties.getOrder().getReturnDisputeDays()));
    }

    private ReturnRequest requireRequest(ShopOrder order, ReturnRequestStatus... allowed) {
        if (order.getStatus() != OrderStatus.RETURN_REQUESTED && order.getStatus() != OrderStatus.RETURN_RECEIVED) {
            throw new BaseException("shop.order.invalidTransition");
        }
        ReturnRequest request = returnRequestRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new BaseException("shop.return.notAllowed"));
        for (ReturnRequestStatus status : allowed) {
            if (request.getStatus() == status) {
                return request;
            }
        }
        throw new BaseException("shop.return.notAllowed");
    }

    private static String requireText(String value) {
        String text = TextSupport.blankToNull(value);
        if (text == null) {
            throw new BaseException("shop.return.reasonRequired");
        }
        return TextSupport.truncate(text, 500);
    }
}
