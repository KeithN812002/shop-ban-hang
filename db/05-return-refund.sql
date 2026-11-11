-- =====================================================================================================
-- 05-return-refund.sql - docs/shop-contract.md section 12 (buyer return and refund):
--   * order statuses RETURN_REQUESTED, RETURN_APPROVED, RETURN_SHIPPING, RETURN_RECEIVED, REFUNDED:
--     widens the shop_order.status CHECK constraint;
--   * shop_order.return_shipper_username / refunded_at;
--   * table shop_return_request (one request per order);
--   * admin permission rows for POST /shop/admin/order/return/resolve (resolveReturn) and
--     POST /shop/admin/order/return/refunded (markRefunded), granted to role ADMIN.
-- Run after 01..04. Idempotent: safe to run again on a database that already has these changes.
-- 02-shop-schema.sql and 04-promotion-returning.sql are intentionally left unchanged.
-- After the permission rows are added, clear the Redis key user:<username>:permissions (or sign in again).
-- =====================================================================================================

-- ---- order status CHECK: add the return/refund statuses ----
-- Looked up by definition (the only CHECK on shop_order listing 'CONFIRMED'), like 04 does, so a renamed
-- constraint is found too.

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

    IF v_name IS NOT NULL AND v_def LIKE '%''REFUNDED''%' THEN
        RETURN;                                   -- already widened
    END IF;
    IF v_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE shop_order DROP CONSTRAINT %I', v_name);
    END IF;
    ALTER TABLE shop_order ADD CONSTRAINT shop_order_status_check CHECK (status IN (
        'PENDING', 'CONFIRMED', 'READY_TO_SHIP', 'PICKING', 'SHIPPING', 'RETURNING', 'DELIVERED', 'COMPLETED',
        'CANCELLED', 'RETURNED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_SHIPPING', 'RETURN_RECEIVED',
        'REFUNDED'));
END $$;

-- ---- shop_order: return leg columns ----

ALTER TABLE shop_order ADD COLUMN IF NOT EXISTS return_shipper_username varchar(50);
ALTER TABLE shop_order ADD COLUMN IF NOT EXISTS refunded_at timestamp;

CREATE INDEX IF NOT EXISTS idx_shop_order_return_available ON shop_order (province, created_date)
    WHERE status = 'RETURN_APPROVED' AND return_shipper_username IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_order_return_shipper ON shop_order (return_shipper_username, status)
    WHERE return_shipper_username IS NOT NULL;

-- ---- shop_return_request ----

CREATE TABLE IF NOT EXISTS shop_return_request (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          uuid          NOT NULL UNIQUE REFERENCES shop_order (id) ON DELETE CASCADE,
    buyer_username    varchar(50)   NOT NULL,
    reason_code       varchar(30)   NOT NULL CHECK (reason_code IN ('DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED',
                                        'MISSING_PARTS', 'OTHER')),
    description       varchar(1000),
    image_urls        text          NOT NULL,                       -- comma-separated, 1..6 images
    bank_name         varchar(100)  NOT NULL,
    bank_account_no   varchar(30)   NOT NULL CHECK (bank_account_no ~ '^[0-9]{6,30}$'),
    bank_account_name varchar(100)  NOT NULL,
    refund_amount     numeric(15,2) NOT NULL,
    status            varchar(20)   NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED',
                                        'REJECTED', 'DISPUTED', 'CANCELLED', 'CLOSED')),
    seller_note       varchar(500),
    dispute_reason    varchar(500),
    admin_note        varchar(500),
    refund_proof_url  varchar(500),
    refund_note       varchar(500),
    requested_at      timestamp     NOT NULL DEFAULT now(),
    responded_at      timestamp,
    disputed_at       timestamp,
    resolved_at       timestamp,
    refunded_at       timestamp,
    refunded_by       varchar(50),
    created_date      timestamp     NOT NULL DEFAULT now(),
    created_by        varchar(50)   NOT NULL DEFAULT 'system',
    updated_date      timestamp     NOT NULL DEFAULT now(),
    updated_by        varchar(50)   NOT NULL DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_shop_return_request_status ON shop_return_request (status, requested_at);
CREATE INDEX IF NOT EXISTS idx_shop_return_request_responded ON shop_return_request (status, responded_at);
CREATE INDEX IF NOT EXISTS idx_shop_return_request_buyer ON shop_return_request (buyer_username);

-- ---- admin permissions: Orders > resolve a disputed return, mark a return refunded ----
-- Same row shape as 04-promotion-returning.sql (FUNCTION rows under the Orders menu of module SHOP-ADMIN).

DO $$
DECLARE
    v_menu varchar;
    v_code varchar;
    v_row  text[];
    v_rows text[] := ARRAY[
        ARRAY['/shop/admin/order/return/resolve',  'Xử lý khiếu nại trả hàng',   'resolveReturn', '3'],
        ARRAY['/shop/admin/order/return/refunded', 'Xác nhận đã hoàn tiền',      'markRefunded',  '4']];
BEGIN
    SELECT p.code INTO v_menu FROM sa_permission p
     WHERE p.type = 'MENU'::permission_type AND p.module_code = 'SHOP-ADMIN' AND p.url_segment = '/order';
    IF v_menu IS NULL THEN
        RAISE NOTICE 'Orders menu of module SHOP-ADMIN not found (run 03-seed.sql first); permission rows skipped';
        RETURN;
    END IF;

    FOREACH v_row SLICE 1 IN ARRAY v_rows LOOP
        v_code := NULL;
        SELECT p.code INTO v_code FROM sa_permission p
         WHERE p.type = 'FUNCTION'::permission_type AND p.module_code = 'SHOP-ADMIN' AND p.parent_code = v_menu
           AND p.uri = v_row[1] AND p.method = 'POST'::http_method;
        IF v_code IS NULL THEN
            v_code := 'FUNCTION_' || lpad(nextval('sa_permission_seq')::text, 6, '0');
            INSERT INTO sa_permission (code, name, foreign_name, parent_code, app_code, module_code, type, url,
                                       url_segment, path_folder, uri, method, button_action, icon, sort_order,
                                       status)
            VALUES (v_code, v_row[2], NULL, v_menu, 'CORE', 'SHOP-ADMIN', 'FUNCTION'::permission_type, NULL, NULL,
                    NULL, v_row[1], 'POST'::http_method, v_row[3], NULL, v_row[4]::integer, 'ACTIVE');
        END IF;
    END LOOP;
END $$;

-- role ADMIN holds every permission (same statement as 03-seed.sql and 04; picks up the new rows)
INSERT INTO sa_role_permission (role_id, permission_id, app_code, status)
SELECT r.id, p.id, 'CORE', 'ACTIVE'
  FROM sa_role r CROSS JOIN sa_permission p
 WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
