package com.fpt.bom.shop.constant;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ShopConstants {

    public static final int MAX_FAILED_DELIVERY_ATTEMPTS = 3;
    public static final int MAX_CHAT_MESSAGES = 20;
    public static final int MAX_CHAT_CONTENT_LENGTH = 2000;
    public static final int MAX_FILE_BYTES = 5 * 1024 * 1024;
    public static final int MAX_SUGGESTIONS = 8;
    public static final int MAX_RELATED = 12;
    public static final int MAX_CHATBOT_PRODUCTS = 8;
    public static final int HOME_SECTION_SIZE = 10;
    public static final int MAX_REVIEW_IMAGES = 5;
    public static final int DEFAULT_STATS_DAYS = 30;
    public static final int TRENDING_WINDOW_DAYS = 7;

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class Action {
        public static final String CREATE = "CREATE";
        public static final String CONFIRM = "CONFIRM";
        public static final String READY_TO_SHIP = "READY_TO_SHIP";
        public static final String ACCEPT = "ACCEPT";
        public static final String PICKED_UP = "PICKED_UP";
        public static final String DELIVERED = "DELIVERED";
        public static final String DELIVERY_FAILED = "DELIVERY_FAILED";
        public static final String RETURNING = "RETURNING";
        public static final String RETURN_RECEIVED = "RETURN_RECEIVED";
        public static final String RETURNED = "RETURNED";
        public static final String CONFIRM_RECEIVED = "CONFIRM_RECEIVED";
        public static final String AUTO_COMPLETE = "AUTO_COMPLETE";
        public static final String CANCEL = "CANCEL";
        public static final String RETURN_REQUEST = "RETURN_REQUEST";
        public static final String RETURN_APPROVE = "RETURN_APPROVE";
        public static final String RETURN_AUTO_APPROVE = "RETURN_AUTO_APPROVE";
        public static final String RETURN_REJECT = "RETURN_REJECT";
        public static final String RETURN_DISPUTE = "RETURN_DISPUTE";
        public static final String RETURN_RESOLVE_APPROVE = "RETURN_RESOLVE_APPROVE";
        public static final String RETURN_RESOLVE_REJECT = "RETURN_RESOLVE_REJECT";
        public static final String RETURN_WITHDRAW = "RETURN_WITHDRAW";
        public static final String RETURN_AUTO_CLOSE = "RETURN_AUTO_CLOSE";
        public static final String RETURN_ACCEPT = "RETURN_ACCEPT";
        public static final String RETURN_GOODS_RECEIVED = "RETURN_GOODS_RECEIVED";
        public static final String REFUND = "REFUND";
    }
}
