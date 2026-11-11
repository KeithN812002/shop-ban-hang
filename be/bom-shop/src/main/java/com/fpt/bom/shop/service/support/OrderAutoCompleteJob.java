package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

/**
 * Hourly job: completes orders that stayed DELIVERED longer than {@code shop.order.auto-complete-days}, approves
 * return requests the seller never answered ({@code return-response-days}) and closes rejected return requests the
 * buyer never disputed ({@code return-dispute-days}).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderAutoCompleteJob {

    private final OrderRepository orderRepository;
    private final OrderTransitions orderTransitions;
    private final ReturnSupport returnSupport;
    private final ShopProperties shopProperties;

    @Scheduled(cron = "0 5 * * * *")
    public void run() {
        autoComplete();
        process("auto-approved return requests", returnSupport.overdueForApproval(), returnSupport::autoApprove);
        process("auto-closed return requests", returnSupport.overdueForClosing(), returnSupport::autoClose);
    }

    private void autoComplete() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(shopProperties.getOrder().getAutoCompleteDays());
        List<UUID> ids = orderRepository.findIdsByStatusDeliveredBefore(OrderStatus.DELIVERED, threshold);
        process("auto-completed delivered orders", ids, orderTransitions::autoComplete);
    }

    /** Runs {@code step} per order id; one failing order does not stop the others. */
    private void process(String what, List<UUID> ids, Consumer<UUID> step) {
        int done = 0;
        for (UUID id : ids) {
            try {
                step.accept(id);
                done++;
            } catch (RuntimeException e) {
                log.error("Scheduled step '{}' failed for order {}", what, id, e);
            }
        }
        if (!ids.isEmpty()) {
            log.info("{} {}/{}", what, done, ids.size());
        }
    }
}
