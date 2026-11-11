-- =====================================================================================================
-- 04-promotion-returning.sql - docs/shop-contract.md section 11:
--   * order status RETURNING (return leg): widens the shop_order.status CHECK constraint;
--   * shop promotions: shop_promotion + shop_promotion_product;
--   * admin permission row for POST /shop/admin/order/confirm-returned (button action confirmReturned).
-- Run after 01..03. Idempotent: safe to run again on a database that already has these changes.
-- 02-shop-schema.sql is intentionally left unchanged; on a fresh volume this file is applied right after it.
-- After the permission row is added, clear the Redis key user:<username>:permissions (or sign in again).
-- =====================================================================================================

-- ---- order status CHECK: add RETURNING ----
-- The inline CHECK of 02-shop-schema.sql is unnamed (shop_order_status_check by Postgres default); it is looked up
-- by its definition (the only CHECK on shop_order listing 'CONFIRMED') so a renamed constraint is found too.

DO $$
DECLARE
    v_name text;
    v_def  text;
BEGIN
    SELECT c.conname, pg_get_constraintdef(c.oid) INTO v_name, v_def
      FROM pg_constraint c
     WHERE c.conrelid = 'shop_order'::regclass
       AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) LIKE '%''CONFIRMED''%';

    IF v_name IS NOT NULL AND v_def LIKE '%''RETURNING''%' THEN
        RETURN;                                   -- already widened
    END IF;
    IF v_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE shop_order DROP CONSTRAINT %I', v_name);
    END IF;
    ALTER TABLE shop_order ADD CONSTRAINT shop_order_status_check CHECK (status IN (
        'PENDING', 'CONFIRMED', 'READY_TO_SHIP', 'PICKING', 'SHIPPING', 'RETURNING', 'DELIVERED', 'COMPLETED',
        'CANCELLED', 'RETURNED'));
END $$;

-- ---- shop promotions ----

CREATE TABLE IF NOT EXISTS shop_promotion (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id         uuid         NOT NULL REFERENCES shop_store (id),
    name             varchar(150) NOT NULL,
    discount_percent integer      NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
    start_at         timestamp    NOT NULL,
    end_at           timestamp    NOT NULL,
    status           varchar(20)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    is_deleted       boolean      NOT NULL DEFAULT false,
    deleted_date     timestamp,
    deleted_by       varchar(50),
    created_date     timestamp    NOT NULL DEFAULT now(),
    created_by       varchar(50)  NOT NULL DEFAULT 'system',
    updated_date     timestamp    NOT NULL DEFAULT now(),
    updated_by       varchar(50)  NOT NULL DEFAULT 'system',
    CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS idx_shop_promotion_store ON shop_promotion (store_id, start_at DESC)
    WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_shop_promotion_window ON shop_promotion (start_at, end_at)
    WHERE is_deleted = false AND status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS shop_promotion_product (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id uuid        NOT NULL REFERENCES shop_promotion (id) ON DELETE CASCADE,
    product_id   uuid        NOT NULL REFERENCES shop_product (id),
    created_date timestamp   NOT NULL DEFAULT now(),
    created_by   varchar(50) NOT NULL DEFAULT 'system',
    updated_date timestamp   NOT NULL DEFAULT now(),
    updated_by   varchar(50) NOT NULL DEFAULT 'system',
    UNIQUE (promotion_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_shop_promotion_product_product ON shop_promotion_product (product_id);

-- ---- admin permission: Orders > confirm returned goods ----
-- Same row shape as the helper in 03-seed.sql (FUNCTION row under the Orders menu of module SHOP-ADMIN).

DO $$
DECLARE
    v_menu varchar;
    v_code varchar;
BEGIN
    SELECT p.code INTO v_menu FROM sa_permission p
     WHERE p.type = 'MENU'::permission_type AND p.module_code = 'SHOP-ADMIN' AND p.url_segment = '/order';
    IF v_menu IS NULL THEN
        RAISE NOTICE 'Orders menu of module SHOP-ADMIN not found (run 03-seed.sql first); permission row skipped';
        RETURN;
    END IF;

    SELECT p.code INTO v_code FROM sa_permission p
     WHERE p.type = 'FUNCTION'::permission_type AND p.module_code = 'SHOP-ADMIN' AND p.parent_code = v_menu
       AND p.uri = '/shop/admin/order/confirm-returned' AND p.method = 'POST'::http_method;
    IF v_code IS NULL THEN
        v_code := 'FUNCTION_' || lpad(nextval('sa_permission_seq')::text, 6, '0');
        INSERT INTO sa_permission (code, name, foreign_name, parent_code, app_code, module_code, type, url,
                                   url_segment, path_folder, uri, method, button_action, icon, sort_order, status)
        VALUES (v_code, 'Xác nhận đã nhận hàng hoàn', NULL, v_menu, 'CORE', 'SHOP-ADMIN',
                'FUNCTION'::permission_type, NULL, NULL, NULL, '/shop/admin/order/confirm-returned',
                'POST'::http_method, 'confirmReturned', NULL, 2, 'ACTIVE');
    END IF;
END $$;

-- role ADMIN holds every permission (same statement as 03-seed.sql; picks up the new row)
INSERT INTO sa_role_permission (role_id, permission_id, app_code, status)
SELECT r.id, p.id, 'CORE', 'ACTIVE'
  FROM sa_role r CROSS JOIN sa_permission p
 WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
