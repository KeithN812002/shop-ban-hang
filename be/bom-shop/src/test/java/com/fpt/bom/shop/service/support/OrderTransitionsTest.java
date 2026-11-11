package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.enums.OrderStatus;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Set;

import static com.fpt.bom.shop.enums.OrderStatus.CANCELLED;
import static com.fpt.bom.shop.enums.OrderStatus.COMPLETED;
import static com.fpt.bom.shop.enums.OrderStatus.DELIVERED;
import static com.fpt.bom.shop.enums.OrderStatus.REFUNDED;
import static com.fpt.bom.shop.enums.OrderStatus.RETURNED;
import static com.fpt.bom.shop.enums.OrderStatus.RETURNING;
import static com.fpt.bom.shop.enums.OrderStatus.RETURN_APPROVED;
import static com.fpt.bom.shop.enums.OrderStatus.RETURN_RECEIVED;
import static com.fpt.bom.shop.enums.OrderStatus.RETURN_REQUESTED;
import static com.fpt.bom.shop.enums.OrderStatus.RETURN_SHIPPING;
import static com.fpt.bom.shop.enums.OrderStatus.SHIPPING;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderTransitionsTest {

    @Test
    void buyerReturnLifecycleIsAllowedStepByStep() {
        assertTrue(OrderTransitions.isAllowed(DELIVERED, RETURN_REQUESTED));
        assertTrue(OrderTransitions.isAllowed(RETURN_REQUESTED, RETURN_APPROVED));
        assertTrue(OrderTransitions.isAllowed(RETURN_REQUESTED, COMPLETED));
        assertTrue(OrderTransitions.isAllowed(RETURN_APPROVED, RETURN_SHIPPING));
        assertTrue(OrderTransitions.isAllowed(RETURN_SHIPPING, RETURN_RECEIVED));
        assertTrue(OrderTransitions.isAllowed(RETURN_RECEIVED, REFUNDED));
    }

    @Test
    void returnStatusesCannotBeSkippedOrReversed() {
        assertFalse(OrderTransitions.isAllowed(DELIVERED, RETURN_APPROVED));
        assertFalse(OrderTransitions.isAllowed(RETURN_REQUESTED, RETURN_SHIPPING));
        assertFalse(OrderTransitions.isAllowed(RETURN_APPROVED, COMPLETED));
        assertFalse(OrderTransitions.isAllowed(RETURN_SHIPPING, REFUNDED));
        assertFalse(OrderTransitions.isAllowed(RETURN_RECEIVED, COMPLETED));
        assertFalse(OrderTransitions.isAllowed(RETURN_RECEIVED, RETURN_SHIPPING));
        assertFalse(OrderTransitions.isAllowed(REFUNDED, RETURN_RECEIVED));
    }

    @Test
    void terminalStatusesHaveNoTransitions() {
        for (OrderStatus terminal : Set.of(COMPLETED, CANCELLED, RETURNED, REFUNDED)) {
            for (OrderStatus target : OrderStatus.values()) {
                assertFalse(OrderTransitions.isAllowed(terminal, target), terminal + " -> " + target);
            }
        }
    }

    @Test
    void failedDeliveryReturnLegIsUnchanged() {
        assertTrue(OrderTransitions.isAllowed(SHIPPING, RETURNING));
        assertTrue(OrderTransitions.isAllowed(RETURNING, RETURNED));
        assertEquals(Set.of(COMPLETED, RETURN_REQUESTED), allowedFrom(DELIVERED));
    }

    private static Set<OrderStatus> allowedFrom(OrderStatus from) {
        Set<OrderStatus> result = EnumSet.noneOf(OrderStatus.class);
        for (OrderStatus target : OrderStatus.values()) {
            if (OrderTransitions.isAllowed(from, target)) {
                result.add(target);
            }
        }
        return result;
    }
}
