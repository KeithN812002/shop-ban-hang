-- =====================================================================================================
-- 02-shop-schema.sql - shop_* tables (docs/shop-contract.md section 4), derived from the JPA entities of
-- bom-shop. Enums are stored as varchar (EnumType.STRING). Money is numeric(15,2); ids are uuid.
-- Requires 01-core-schema.sql only for naming consistency (no FK to sa_* tables: owners are identified by
-- the Keycloak username). Idempotent.
-- =====================================================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- trigram index for "contains" product search
CREATE EXTENSION IF NOT EXISTS unaccent;  -- accent-insensitive product search ("kinh mat" finds "Kính mát")

-- ---- catalogue ----

CREATE TABLE IF NOT EXISTS shop_category (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         varchar(200) NOT NULL,
    slug         varchar(220) NOT NULL UNIQUE,
    parent_id    uuid REFERENCES shop_category (id),
    icon         varchar(100),
    image_url    varchar(500),
    sort_order   integer      NOT NULL DEFAULT 0,
    status       varchar(20)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_category_parent ON shop_category (parent_id);

CREATE TABLE IF NOT EXISTS shop_store (
    id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_username varchar(50)  NOT NULL UNIQUE,
    name           varchar(200) NOT NULL,
    slug           varchar(220) NOT NULL UNIQUE,
    description    varchar(4000),
    logo_url       varchar(500),
    banner_url     varchar(500),
    phone          varchar(30),
    address        varchar(500),
    province       varchar(100),
    status         varchar(20)  NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED')),
    reject_reason  varchar(500),
    rating_avg     double precision NOT NULL DEFAULT 0,
    rating_count   integer      NOT NULL DEFAULT 0,
    product_count  integer      NOT NULL DEFAULT 0,
    follower_count integer      NOT NULL DEFAULT 0,
    is_deleted     boolean      NOT NULL DEFAULT false,
    deleted_date   timestamp,
    deleted_by     varchar(50),
    created_date   timestamp    NOT NULL DEFAULT now(),
    created_by     varchar(50)  NOT NULL DEFAULT 'system',
    updated_date   timestamp    NOT NULL DEFAULT now(),
    updated_by     varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_store_status ON shop_store (status) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS shop_store_follow (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id     uuid        NOT NULL REFERENCES shop_store (id) ON DELETE CASCADE,
    username     varchar(50) NOT NULL,
    created_date timestamp   NOT NULL DEFAULT now(),
    created_by   varchar(50) NOT NULL DEFAULT 'system',
    updated_date timestamp   NOT NULL DEFAULT now(),
    updated_by   varchar(50) NOT NULL DEFAULT 'system',
    CONSTRAINT uk_shop_store_follow UNIQUE (store_id, username)
);
CREATE INDEX IF NOT EXISTS idx_shop_store_follow_user ON shop_store_follow (username, created_date DESC);

CREATE TABLE IF NOT EXISTS shop_product (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id       uuid          NOT NULL REFERENCES shop_store (id),
    category_id    uuid          REFERENCES shop_category (id),
    name           varchar(300)  NOT NULL,
    slug           varchar(350)  NOT NULL,
    description    varchar(10000),
    price          numeric(15,2) NOT NULL CHECK (price >= 0),
    original_price numeric(15,2),
    stock          integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sold_count     integer       NOT NULL DEFAULT 0,
    view_count     bigint        NOT NULL DEFAULT 0,
    rating_avg     double precision NOT NULL DEFAULT 0,
    rating_count   integer       NOT NULL DEFAULT 0,
    thumbnail_url  varchar(500),
    tags           varchar(500),
    status         varchar(20)   NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'HIDDEN', 'BANNED')),
    ban_reason     varchar(500),
    ar_type        varchar(30)   NOT NULL DEFAULT 'NONE' CHECK (ar_type IN
                       ('NONE', 'FACE_GLASSES', 'FACE_HAT', 'FACE_JEWELRY', 'BODY_TOP', 'BODY_BOTTOM', 'OBJECT')),
    ar_overlay_url varchar(500),
    ar_scale       double precision NOT NULL DEFAULT 1.0,
    ar_offset_y    double precision NOT NULL DEFAULT 0,
    is_deleted     boolean       NOT NULL DEFAULT false,
    deleted_date   timestamp,
    deleted_by     varchar(50),
    created_date   timestamp     NOT NULL DEFAULT now(),
    created_by     varchar(50)   NOT NULL DEFAULT 'system',
    updated_date   timestamp     NOT NULL DEFAULT now(),
    updated_by     varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_product_store ON shop_product (store_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_shop_product_category ON shop_product (category_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_shop_product_visible_sold ON shop_product (sold_count DESC)
    WHERE is_deleted = false AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_shop_product_visible_created ON shop_product (created_date DESC)
    WHERE is_deleted = false AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_shop_product_price ON shop_product (price);
CREATE INDEX IF NOT EXISTS idx_shop_product_name_trgm ON shop_product USING gin (lower(name) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS shop_product_image (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   uuid         NOT NULL REFERENCES shop_product (id) ON DELETE CASCADE,
    url          varchar(500) NOT NULL,
    sort_order   integer      NOT NULL DEFAULT 0,
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_product_image_product ON shop_product_image (product_id, sort_order);

CREATE TABLE IF NOT EXISTS shop_product_variant (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   uuid          NOT NULL REFERENCES shop_product (id) ON DELETE CASCADE,
    name         varchar(200)  NOT NULL,
    price        numeric(15,2) NOT NULL CHECK (price >= 0),
    stock        integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku          varchar(100),
    created_date timestamp     NOT NULL DEFAULT now(),
    created_by   varchar(50)   NOT NULL DEFAULT 'system',
    updated_date timestamp     NOT NULL DEFAULT now(),
    updated_by   varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_product_variant_product ON shop_product_variant (product_id);

-- ---- buyer data ----

CREATE TABLE IF NOT EXISTS shop_cart_item (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    username     varchar(50) NOT NULL,
    product_id   uuid        NOT NULL REFERENCES shop_product (id) ON DELETE CASCADE,
    variant_id   uuid        REFERENCES shop_product_variant (id) ON DELETE CASCADE,
    quantity     integer     NOT NULL CHECK (quantity > 0),
    selected     boolean     NOT NULL DEFAULT true,
    created_date timestamp   NOT NULL DEFAULT now(),
    created_by   varchar(50) NOT NULL DEFAULT 'system',
    updated_date timestamp   NOT NULL DEFAULT now(),
    updated_by   varchar(50) NOT NULL DEFAULT 'system'
);
-- (username, product_id, variant_id) is unique; a NULL variant is treated as one value.
CREATE UNIQUE INDEX IF NOT EXISTS uk_shop_cart_item_line ON shop_cart_item
    (username, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_shop_cart_item_user ON shop_cart_item (username, created_date DESC);

CREATE TABLE IF NOT EXISTS shop_wishlist (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    username     varchar(50) NOT NULL,
    product_id   uuid        NOT NULL REFERENCES shop_product (id) ON DELETE CASCADE,
    created_date timestamp   NOT NULL DEFAULT now(),
    created_by   varchar(50) NOT NULL DEFAULT 'system',
    updated_date timestamp   NOT NULL DEFAULT now(),
    updated_by   varchar(50) NOT NULL DEFAULT 'system',
    CONSTRAINT uk_shop_wishlist UNIQUE (username, product_id)
);

CREATE TABLE IF NOT EXISTS shop_address (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      varchar(50)  NOT NULL,
    receiver_name varchar(200) NOT NULL,
    phone         varchar(30)  NOT NULL,
    province      varchar(100) NOT NULL,
    district      varchar(100),
    ward          varchar(100),
    detail        varchar(500) NOT NULL,
    is_default    boolean      NOT NULL DEFAULT false,
    created_date  timestamp    NOT NULL DEFAULT now(),
    created_by    varchar(50)  NOT NULL DEFAULT 'system',
    updated_date  timestamp    NOT NULL DEFAULT now(),
    updated_by    varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_address_user ON shop_address (username);

-- ---- vouchers ----

CREATE TABLE IF NOT EXISTS shop_voucher (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id        uuid          REFERENCES shop_store (id),     -- NULL = platform voucher
    code            varchar(50)   NOT NULL UNIQUE,
    name            varchar(200)  NOT NULL,
    discount_type   varchar(10)   NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value  numeric(15,2) NOT NULL CHECK (discount_value > 0),
    max_discount    numeric(15,2),
    min_order_value numeric(15,2),
    start_at        timestamp     NOT NULL,
    end_at          timestamp     NOT NULL,
    usage_limit     integer,
    used_count      integer       NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    per_user_limit  integer,
    status          varchar(20)   NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_date    timestamp     NOT NULL DEFAULT now(),
    created_by      varchar(50)   NOT NULL DEFAULT 'system',
    updated_date    timestamp     NOT NULL DEFAULT now(),
    updated_by      varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_voucher_store ON shop_voucher (store_id);
CREATE INDEX IF NOT EXISTS idx_shop_voucher_window ON shop_voucher (status, end_at);

-- ---- orders ----

CREATE TABLE IF NOT EXISTS shop_order (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    version             bigint        NOT NULL DEFAULT 0,        -- optimistic lock (@Version)
    code                varchar(20)   NOT NULL UNIQUE,
    buyer_username      varchar(50)   NOT NULL,
    store_id            uuid          NOT NULL REFERENCES shop_store (id),
    receiver_name       varchar(200)  NOT NULL,
    receiver_phone      varchar(30)   NOT NULL,
    shipping_address    varchar(1000) NOT NULL,
    province            varchar(100),
    subtotal            numeric(15,2) NOT NULL DEFAULT 0,
    shipping_fee        numeric(15,2) NOT NULL DEFAULT 0,
    store_discount      numeric(15,2) NOT NULL DEFAULT 0,
    platform_discount   numeric(15,2) NOT NULL DEFAULT 0,
    total               numeric(15,2) NOT NULL DEFAULT 0,
    platform_fee        numeric(15,2) NOT NULL DEFAULT 0,
    seller_income       numeric(15,2) NOT NULL DEFAULT 0,
    shipper_fee         numeric(15,2) NOT NULL DEFAULT 0,
    payment_method      varchar(20)   NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
    payment_status      varchar(20)   NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    status              varchar(20)   NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'READY_TO_SHIP', 'PICKING',
                            'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')),
    note                varchar(500),
    cancel_reason       varchar(500),
    cancelled_by        varchar(20),
    shipper_username    varchar(50),
    failed_attempts     integer       NOT NULL DEFAULT 0,
    delivery_proof_url  varchar(500),
    confirmed_at        timestamp,
    shipped_at          timestamp,
    delivered_at        timestamp,
    completed_at        timestamp,
    cancelled_at        timestamp,
    store_voucher_id    uuid,
    platform_voucher_id uuid,
    created_date        timestamp     NOT NULL DEFAULT now(),
    created_by          varchar(50)   NOT NULL DEFAULT 'system',
    updated_date        timestamp     NOT NULL DEFAULT now(),
    updated_by          varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_order_buyer ON shop_order (buyer_username, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_order_store ON shop_order (store_id, status, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_order_shipper ON shop_order (shipper_username, status);
CREATE INDEX IF NOT EXISTS idx_shop_order_available ON shop_order (province, created_date)
    WHERE status = 'READY_TO_SHIP' AND shipper_username IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_order_delivered ON shop_order (delivered_at) WHERE status = 'DELIVERED';
CREATE INDEX IF NOT EXISTS idx_shop_order_completed ON shop_order (completed_at) WHERE status = 'COMPLETED';
CREATE INDEX IF NOT EXISTS idx_shop_order_created ON shop_order (created_date);

CREATE TABLE IF NOT EXISTS shop_order_item (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid          NOT NULL REFERENCES shop_order (id) ON DELETE CASCADE,
    product_id   uuid          NOT NULL REFERENCES shop_product (id),
    variant_id   uuid,                                            -- snapshot only: variants may be deleted later
    product_name varchar(300)  NOT NULL,
    variant_name varchar(200),
    image_url    varchar(500),
    price        numeric(15,2) NOT NULL,
    quantity     integer       NOT NULL CHECK (quantity > 0),
    reviewed     boolean       NOT NULL DEFAULT false,
    created_date timestamp     NOT NULL DEFAULT now(),
    created_by   varchar(50)   NOT NULL DEFAULT 'system',
    updated_date timestamp     NOT NULL DEFAULT now(),
    updated_by   varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_order_item_order ON shop_order_item (order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_item_product ON shop_order_item (product_id);

CREATE TABLE IF NOT EXISTS shop_order_history (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      uuid        NOT NULL REFERENCES shop_order (id) ON DELETE CASCADE,
    action        varchar(50) NOT NULL,
    status_before varchar(20),
    status_after  varchar(20) NOT NULL,
    actor         varchar(50) NOT NULL,
    source        varchar(20) NOT NULL CHECK (source IN ('BUYER', 'SELLER', 'SHIPPER', 'ADMIN', 'SYSTEM')),
    note          varchar(500),
    created_date  timestamp   NOT NULL DEFAULT now(),
    created_by    varchar(50) NOT NULL DEFAULT 'system',
    updated_date  timestamp   NOT NULL DEFAULT now(),
    updated_by    varchar(50) NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_order_history_order ON shop_order_history (order_id, created_date);
CREATE INDEX IF NOT EXISTS idx_shop_order_history_action ON shop_order_history (action, actor, created_date);

CREATE TABLE IF NOT EXISTS shop_voucher_usage (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id   uuid        NOT NULL REFERENCES shop_voucher (id),
    username     varchar(50) NOT NULL,
    order_id     uuid        NOT NULL REFERENCES shop_order (id) ON DELETE CASCADE,
    created_date timestamp   NOT NULL DEFAULT now(),
    created_by   varchar(50) NOT NULL DEFAULT 'system',
    updated_date timestamp   NOT NULL DEFAULT now(),
    updated_by   varchar(50) NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_voucher_usage_user ON shop_voucher_usage (voucher_id, username);
CREATE INDEX IF NOT EXISTS idx_shop_voucher_usage_order ON shop_voucher_usage (order_id);

CREATE TABLE IF NOT EXISTS shop_review (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id  uuid          NOT NULL UNIQUE REFERENCES shop_order_item (id),
    product_id     uuid          NOT NULL REFERENCES shop_product (id),
    store_id       uuid          NOT NULL REFERENCES shop_store (id),
    buyer_username varchar(50)   NOT NULL,
    rating         smallint      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        varchar(2000),
    image_urls     varchar(2000),
    seller_reply   varchar(2000),
    replied_at     timestamp,
    created_date   timestamp     NOT NULL DEFAULT now(),
    created_by     varchar(50)   NOT NULL DEFAULT 'system',
    updated_date   timestamp     NOT NULL DEFAULT now(),
    updated_by     varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_review_product ON shop_review (product_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_review_store ON shop_review (store_id, created_date DESC);

-- ---- shippers, notifications, chat, search ----

CREATE TABLE IF NOT EXISTS shop_shipper (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      varchar(50)  NOT NULL UNIQUE,
    full_name     varchar(200) NOT NULL,
    phone         varchar(30)  NOT NULL,
    id_number     varchar(30)  NOT NULL,
    vehicle_type  varchar(50),
    vehicle_plate varchar(30),
    area_province varchar(100),
    status        varchar(20)  NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED')),
    reject_reason varchar(500),
    created_date  timestamp    NOT NULL DEFAULT now(),
    created_by    varchar(50)  NOT NULL DEFAULT 'system',
    updated_date  timestamp    NOT NULL DEFAULT now(),
    updated_by    varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_shipper_status ON shop_shipper (status);

CREATE TABLE IF NOT EXISTS shop_notification (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    username     varchar(50)   NOT NULL,
    type         varchar(20)   NOT NULL CHECK (type IN ('ORDER', 'PROMOTION', 'SYSTEM', 'CHAT')),
    title        varchar(300)  NOT NULL,
    content      varchar(1000),
    link         varchar(500),
    is_read      boolean       NOT NULL DEFAULT false,
    created_date timestamp     NOT NULL DEFAULT now(),
    created_by   varchar(50)   NOT NULL DEFAULT 'system',
    updated_date timestamp     NOT NULL DEFAULT now(),
    updated_by   varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_notification_user ON shop_notification (username, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_shop_notification_unread ON shop_notification (username) WHERE is_read = false;

CREATE TABLE IF NOT EXISTS shop_conversation (
    id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_username  varchar(50)  NOT NULL,
    store_id        uuid         NOT NULL REFERENCES shop_store (id),
    last_message    varchar(1000),
    last_message_at timestamp,
    buyer_unread    integer      NOT NULL DEFAULT 0,
    seller_unread   integer      NOT NULL DEFAULT 0,
    created_date    timestamp    NOT NULL DEFAULT now(),
    created_by      varchar(50)  NOT NULL DEFAULT 'system',
    updated_date    timestamp    NOT NULL DEFAULT now(),
    updated_by      varchar(50)  NOT NULL DEFAULT 'system',
    CONSTRAINT uk_shop_conversation UNIQUE (buyer_username, store_id)
);
CREATE INDEX IF NOT EXISTS idx_shop_conversation_store ON shop_conversation (store_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS shop_message (
    id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid         NOT NULL REFERENCES shop_conversation (id) ON DELETE CASCADE,
    sender_username varchar(50)  NOT NULL,
    sender_role     varchar(10)  NOT NULL CHECK (sender_role IN ('BUYER', 'SELLER')),
    content         varchar(2000) NOT NULL,
    product_id      uuid         REFERENCES shop_product (id),
    created_date    timestamp    NOT NULL DEFAULT now(),
    created_by      varchar(50)  NOT NULL DEFAULT 'system',
    updated_date    timestamp    NOT NULL DEFAULT now(),
    updated_by      varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_message_conversation ON shop_message (conversation_id, created_date);

CREATE TABLE IF NOT EXISTS shop_search_log (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword      varchar(200) NOT NULL,                           -- lower-cased, trimmed
    username     varchar(50),
    created_date timestamp    NOT NULL DEFAULT now(),
    created_by   varchar(50)  NOT NULL DEFAULT 'system',
    updated_date timestamp    NOT NULL DEFAULT now(),
    updated_by   varchar(50)  NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_search_log_created ON shop_search_log (created_date, keyword);
