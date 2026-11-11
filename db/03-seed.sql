-- =====================================================================================================
-- 03-seed.sql - reference data: menu/permission tree (SA + ShopAdministration), the ADMIN role granted
-- every permission, and the shop category tree. No products, users or orders are seeded.
-- Run after 01-core-schema.sql and 02-shop-schema.sql. Idempotent (rows are looked up before insert).
--
-- Permission model (bom-sa Permission): ROOT (module card, url = /sa) -> MENU (screen: url, path_folder) ->
-- FUNCTION (button, matched by buttonAction in the FE) and API (extra endpoints the screen calls). Backend
-- authorization matches request method + uri (Ant pattern) against every FUNCTION/API/... row granted to a role.
-- =====================================================================================================

-- ---- helpers (session-local, dropped automatically) ----

CREATE OR REPLACE FUNCTION pg_temp.seed_perm(
    p_type text, p_parent text, p_module text, p_name text, p_foreign text, p_segment text, p_folder text,
    p_uri text, p_method text, p_action text, p_icon text, p_sort integer) RETURNS varchar AS $$
DECLARE
    v_code       varchar;
    v_url        varchar;
    v_parent_url varchar;
BEGIN
    SELECT p.code INTO v_code FROM sa_permission p
     WHERE p.type = p_type::permission_type
       AND p.parent_code IS NOT DISTINCT FROM p_parent
       AND p.module_code = p_module
       AND p.name = p_name
       AND COALESCE(p.url_segment, '') = COALESCE(p_segment, '')
       AND COALESCE(p.uri, '') = COALESCE(p_uri, '')
       AND COALESCE(p.method::text, '') = COALESCE(p_method, '')
       AND COALESCE(p.button_action, '') = COALESCE(p_action, '');
    IF v_code IS NOT NULL THEN
        RETURN v_code;
    END IF;

    v_code := p_type || '_' || lpad(nextval('sa_permission_seq')::text, 6, '0');
    IF p_segment IS NOT NULL THEN
        SELECT COALESCE(p.url, '') INTO v_parent_url FROM sa_permission p WHERE p.code = p_parent;
        v_url := COALESCE(v_parent_url, '') || p_segment;
    END IF;
    INSERT INTO sa_permission (code, name, foreign_name, parent_code, app_code, module_code, type, url,
                               url_segment, path_folder, uri, method, button_action, icon, sort_order, status)
    VALUES (v_code, p_name, p_foreign, p_parent, 'CORE', p_module, p_type::permission_type, v_url,
            p_segment, p_folder, p_uri, p_method::http_method, p_action, p_icon, p_sort, 'ACTIVE');
    RETURN v_code;
END $$ LANGUAGE plpgsql;

-- A FUNCTION row: a button (button_action) bound to one endpoint.
CREATE OR REPLACE FUNCTION pg_temp.seed_fn(p_parent text, p_module text, p_name text, p_action text,
    p_method text, p_uri text, p_sort integer) RETURNS void AS $$
BEGIN
    PERFORM pg_temp.seed_perm('FUNCTION', p_parent, p_module, p_name, NULL, NULL, NULL, p_uri, p_method,
                              p_action, NULL, p_sort);
END $$ LANGUAGE plpgsql;

-- An API row: an endpoint the screen calls that is not a button.
CREATE OR REPLACE FUNCTION pg_temp.seed_api(p_parent text, p_module text, p_method text, p_uri text,
    p_sort integer) RETURNS void AS $$
BEGIN
    PERFORM pg_temp.seed_perm('API', p_parent, p_module, p_method || ' ' || p_uri, NULL, NULL, NULL, p_uri,
                              p_method, NULL, NULL, p_sort);
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.seed_cat(p_name text, p_slug text, p_parent_slug text, p_sort integer,
    p_icon text) RETURNS void AS $$
BEGIN
    INSERT INTO shop_category (name, slug, parent_id, icon, sort_order, status)
    VALUES (p_name, p_slug, (SELECT c.id FROM shop_category c WHERE c.slug = p_parent_slug), p_icon, p_sort,
            'ACTIVE')
    ON CONFLICT (slug) DO NOTHING;
END $$ LANGUAGE plpgsql;

-- ---- module SA: system administration (screens under fe/apps/web/src/pages/SystemAdministration) ----

DO $$
DECLARE
    r varchar;
    m varchar;
BEGIN
    r := pg_temp.seed_perm('ROOT', NULL, 'SA', 'Quản trị hệ thống', 'System Administration', '/sa', NULL, NULL,
                           NULL, NULL, 'Settings', 1);

    -- Role
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Nhóm quyền', 'Roles', '/role', '/SystemAdministration/Role', NULL,
                           NULL, NULL, 'Shield', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Thêm nhóm quyền', 'create', 'POST', '/sa/role/create', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Sửa nhóm quyền', 'update', 'POST', '/sa/role/update', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Xóa nhóm quyền', 'delete', 'POST', '/sa/role/delete', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/role/search', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/role/options', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/role/{id}', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/permission/all-active-for-role', 4);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/role/active', 5);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/role/inactive', 6);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/role/active-bulk', 7);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/role/inactive-bulk', 8);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/role/delete-bulk', 9);

    -- Internal users
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Người dùng nội bộ', 'Internal users', '/internal-user',
                           '/SystemAdministration/InternalUser', NULL, NULL, NULL, 'Users', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Gán nhóm quyền', 'assign-roles', 'POST', '/sa/internal-user/assign-roles', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Kích hoạt', 'active', 'POST', '/sa/internal-user/active', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Ngừng hoạt động', 'inactive', 'POST', '/sa/internal-user/inactive', 3);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Xóa', 'delete', 'POST', '/sa/internal-user/delete', 4);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/internal-user/search', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/internal-user/options', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/internal-user/{id}', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/role/options', 4);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/internal-user/active-bulk', 5);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/internal-user/inactive-bulk', 6);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/internal-user/delete-bulk', 7);

    -- External users (also used by ShopAdministration/Account to lock and unlock accounts)
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Người dùng ngoài', 'External users', '/external-user',
                           '/SystemAdministration/ExternalUser', NULL, NULL, NULL, 'UserCheck', 3);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Thêm người dùng', 'create', 'POST', '/sa/external-user/create', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Sửa người dùng', 'update', 'POST', '/sa/external-user/update', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Kích hoạt', 'active', 'POST', '/sa/external-user/active', 3);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Ngừng hoạt động', 'inactive', 'POST', '/sa/external-user/inactive', 4);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Xóa', 'delete', 'POST', '/sa/external-user/delete', 5);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Đặt lại mật khẩu', 'reset-password', 'POST',
                            '/sa/external-user/reset-password', 6);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/external-user/search', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/external-user/options', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/external-user/{id}', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/role/options', 4);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/external-user/active-bulk', 5);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/external-user/inactive-bulk', 6);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/external-user/delete-bulk', 7);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/external-user/reset-password-bulk', 8);

    -- Menu / permission administration
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Menu và chức năng', 'Menus and permissions', '/permission',
                           '/SystemAdministration/Permission', NULL, NULL, NULL, 'ListTree', 4);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Thêm', 'create', 'POST', '/sa/permission/create', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Sửa', 'update', 'POST', '/sa/permission/update', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Xóa', 'delete', 'POST', '/sa/permission/delete', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/permission/all', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/permission/{id}', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/permission/export', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/permission/import/preview', 4);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/permission/import/apply', 5);

    -- Email templates
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Mẫu email', 'Email templates', '/email-template',
                           '/SystemAdministration/EmailTemplate', NULL, NULL, NULL, 'Mail', 5);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Sửa mẫu', 'update', 'POST', '/sa/email-template/{type}/update', 1);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Kích hoạt', 'active', 'POST', '/sa/email-template/{type}/active', 2);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Ngừng hoạt động', 'inactive', 'POST', '/sa/email-template/{type}/inactive', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/email-template/{type}/search', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/email-template/{type}/{id}', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/email-template/{type}/active-bulk', 3);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/email-template/{type}/inactive-bulk', 4);

    -- Email outbox
    m := pg_temp.seed_perm('MENU', r, 'SA', 'Hộp thư email', 'Email outbox', '/email-outbox',
                           '/SystemAdministration/EmailOutbox', NULL, NULL, NULL, 'Inbox', 6);
    PERFORM pg_temp.seed_fn(m, 'SA', 'Gửi lại', 'resend', 'POST', '/sa/email-outbox/resend', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/email-outbox/search', 1);
    PERFORM pg_temp.seed_api(m, 'SA', 'GET', '/sa/email-outbox/{id}', 2);
    PERFORM pg_temp.seed_api(m, 'SA', 'POST', '/sa/email-outbox/resend-bulk', 3);
END $$;

-- ---- module SHOP-ADMIN: shop administration (fe/apps/web/src/pages/ShopAdministration) ----

DO $$
DECLARE
    r varchar;
    m varchar;
    s CONSTANT text := 'SHOP-ADMIN';
BEGIN
    r := pg_temp.seed_perm('ROOT', NULL, s, 'Quản trị bán hàng', 'Shop Administration', '/shop-admin', NULL, NULL,
                           NULL, NULL, 'Store', 2);

    -- Dashboard (read only)
    m := pg_temp.seed_perm('MENU', r, s, 'Tổng quan', 'Dashboard', '/dashboard', '/ShopAdministration/Dashboard',
                           NULL, NULL, NULL, 'LayoutDashboard', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/stats/overview', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/stats/revenue-chart', 2);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/stats/top-stores', 3);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/stats/top-products', 4);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/stats/top-categories', 5);

    -- Account: lock / unlock reuse the core sa/external-user endpoints
    m := pg_temp.seed_perm('MENU', r, s, 'Tài khoản', 'Accounts', '/account', '/ShopAdministration/Account', NULL,
                           NULL, NULL, 'Users', 2);
    PERFORM pg_temp.seed_fn(m, s, 'Khóa tài khoản', 'lock', 'POST', '/sa/external-user/inactive', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Mở khóa tài khoản', 'unlock', 'POST', '/sa/external-user/active', 2);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/account/search', 1);

    -- Category
    m := pg_temp.seed_perm('MENU', r, s, 'Danh mục', 'Categories', '/category', '/ShopAdministration/Category',
                           NULL, NULL, NULL, 'FolderTree', 3);
    PERFORM pg_temp.seed_fn(m, s, 'Thêm danh mục', 'create', 'POST', '/shop/admin/category/create', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Sửa danh mục', 'update', 'POST', '/shop/admin/category/update', 2);
    PERFORM pg_temp.seed_fn(m, s, 'Xóa danh mục', 'delete', 'POST', '/shop/admin/category/delete', 3);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/category/tree', 1);

    -- Store
    m := pg_temp.seed_perm('MENU', r, s, 'Cửa hàng', 'Stores', '/store', '/ShopAdministration/Store', NULL, NULL,
                           NULL, 'Store', 4);
    PERFORM pg_temp.seed_fn(m, s, 'Duyệt cửa hàng', 'approve', 'POST', '/shop/admin/store/approve', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Từ chối cửa hàng', 'reject', 'POST', '/shop/admin/store/reject', 2);
    PERFORM pg_temp.seed_fn(m, s, 'Tạm ngưng cửa hàng', 'suspend', 'POST', '/shop/admin/store/suspend', 3);
    PERFORM pg_temp.seed_fn(m, s, 'Kích hoạt lại cửa hàng', 'reactivate', 'POST', '/shop/admin/store/reactivate', 4);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/store/search', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/store/{id}', 2);

    -- Shipper
    m := pg_temp.seed_perm('MENU', r, s, 'Người giao hàng', 'Shippers', '/shipper', '/ShopAdministration/Shipper',
                           NULL, NULL, NULL, 'Truck', 5);
    PERFORM pg_temp.seed_fn(m, s, 'Duyệt người giao hàng', 'approve', 'POST', '/shop/admin/shipper/approve', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Từ chối người giao hàng', 'reject', 'POST', '/shop/admin/shipper/reject', 2);
    PERFORM pg_temp.seed_fn(m, s, 'Tạm ngưng người giao hàng', 'suspend', 'POST', '/shop/admin/shipper/suspend', 3);
    PERFORM pg_temp.seed_fn(m, s, 'Kích hoạt lại người giao hàng', 'reactivate', 'POST',
                            '/shop/admin/shipper/reactivate', 4);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/shipper/search', 1);

    -- Product (filters need the category tree and the store list)
    m := pg_temp.seed_perm('MENU', r, s, 'Sản phẩm', 'Products', '/product', '/ShopAdministration/Product', NULL,
                           NULL, NULL, 'Package', 6);
    PERFORM pg_temp.seed_fn(m, s, 'Khóa sản phẩm', 'ban', 'POST', '/shop/admin/product/ban', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Mở khóa sản phẩm', 'unban', 'POST', '/shop/admin/product/unban', 2);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/product/search', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/product/{id}', 2);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/category/tree', 3);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/store/search', 4);

    -- Order
    m := pg_temp.seed_perm('MENU', r, s, 'Đơn hàng', 'Orders', '/order', '/ShopAdministration/Order', NULL, NULL,
                           NULL, 'ShoppingCart', 7);
    PERFORM pg_temp.seed_fn(m, s, 'Hủy đơn hàng', 'cancel', 'POST', '/shop/admin/order/cancel', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/order/search', 1);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/order/{id}', 2);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/store/search', 3);

    -- Voucher (platform vouchers)
    m := pg_temp.seed_perm('MENU', r, s, 'Voucher', 'Vouchers', '/voucher', '/ShopAdministration/Voucher', NULL,
                           NULL, NULL, 'Ticket', 8);
    PERFORM pg_temp.seed_fn(m, s, 'Thêm voucher', 'create', 'POST', '/shop/admin/voucher/create', 1);
    PERFORM pg_temp.seed_fn(m, s, 'Sửa voucher', 'update', 'POST', '/shop/admin/voucher/update', 2);
    PERFORM pg_temp.seed_fn(m, s, 'Xóa voucher', 'delete', 'POST', '/shop/admin/voucher/delete', 3);
    PERFORM pg_temp.seed_api(m, s, 'GET', '/shop/admin/voucher/search', 1);
END $$;

-- ---- role ADMIN: every permission ----

INSERT INTO sa_role (code, name, app_code, status)
VALUES ('ADMIN', 'Quản trị viên', 'CORE', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sa_role_permission (role_id, permission_id, app_code, status)
SELECT r.id, p.id, 'CORE', 'ACTIVE'
  FROM sa_role r CROSS JOIN sa_permission p
 WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---- shop categories ----

DO $$
BEGIN
    PERFORM pg_temp.seed_cat('Thời trang nam', 'thoi-trang-nam', NULL, 1, 'Shirt');
    PERFORM pg_temp.seed_cat('Áo thun nam', 'ao-thun-nam', 'thoi-trang-nam', 1, NULL);
    PERFORM pg_temp.seed_cat('Áo sơ mi nam', 'ao-so-mi-nam', 'thoi-trang-nam', 2, NULL);
    PERFORM pg_temp.seed_cat('Áo khoác nam', 'ao-khoac-nam', 'thoi-trang-nam', 3, NULL);
    PERFORM pg_temp.seed_cat('Quần jean nam', 'quan-jean-nam', 'thoi-trang-nam', 4, NULL);
    PERFORM pg_temp.seed_cat('Quần short nam', 'quan-short-nam', 'thoi-trang-nam', 5, NULL);
    PERFORM pg_temp.seed_cat('Giày dép nam', 'giay-dep-nam', 'thoi-trang-nam', 6, NULL);

    PERFORM pg_temp.seed_cat('Thời trang nữ', 'thoi-trang-nu', NULL, 2, 'Shirt');
    PERFORM pg_temp.seed_cat('Áo thun nữ', 'ao-thun-nu', 'thoi-trang-nu', 1, NULL);
    PERFORM pg_temp.seed_cat('Áo sơ mi nữ', 'ao-so-mi-nu', 'thoi-trang-nu', 2, NULL);
    PERFORM pg_temp.seed_cat('Váy và đầm', 'vay-dam', 'thoi-trang-nu', 3, NULL);
    PERFORM pg_temp.seed_cat('Quần nữ', 'quan-nu', 'thoi-trang-nu', 4, NULL);
    PERFORM pg_temp.seed_cat('Chân váy', 'chan-vay', 'thoi-trang-nu', 5, NULL);
    PERFORM pg_temp.seed_cat('Giày dép nữ', 'giay-dep-nu', 'thoi-trang-nu', 6, NULL);
    PERFORM pg_temp.seed_cat('Túi xách nữ', 'tui-xach-nu', 'thoi-trang-nu', 7, NULL);

    PERFORM pg_temp.seed_cat('Kính mắt', 'kinh-mat', NULL, 3, 'Glasses');
    PERFORM pg_temp.seed_cat('Kính mát', 'kinh-mat-thoi-trang', 'kinh-mat', 1, NULL);
    PERFORM pg_temp.seed_cat('Gọng kính', 'gong-kinh', 'kinh-mat', 2, NULL);
    PERFORM pg_temp.seed_cat('Kính chống ánh sáng xanh', 'kinh-chong-anh-sang-xanh', 'kinh-mat', 3, NULL);

    PERFORM pg_temp.seed_cat('Mũ nón', 'mu-non', NULL, 4, 'HardHat');
    PERFORM pg_temp.seed_cat('Mũ lưỡi trai', 'mu-luoi-trai', 'mu-non', 1, NULL);
    PERFORM pg_temp.seed_cat('Mũ bucket', 'mu-bucket', 'mu-non', 2, NULL);
    PERFORM pg_temp.seed_cat('Mũ len và beanie', 'mu-len-beanie', 'mu-non', 3, NULL);
    PERFORM pg_temp.seed_cat('Nón rộng vành', 'non-rong-vanh', 'mu-non', 4, NULL);

    PERFORM pg_temp.seed_cat('Trang sức', 'trang-suc', NULL, 5, 'Gem');
    PERFORM pg_temp.seed_cat('Dây chuyền', 'day-chuyen', 'trang-suc', 1, NULL);
    PERFORM pg_temp.seed_cat('Nhẫn', 'nhan', 'trang-suc', 2, NULL);
    PERFORM pg_temp.seed_cat('Bông tai', 'bong-tai', 'trang-suc', 3, NULL);
    PERFORM pg_temp.seed_cat('Lắc tay và vòng tay', 'lac-tay-vong-tay', 'trang-suc', 4, NULL);

    PERFORM pg_temp.seed_cat('Điện thoại', 'dien-thoai', NULL, 6, 'Smartphone');
    PERFORM pg_temp.seed_cat('Điện thoại thông minh', 'dien-thoai-thong-minh', 'dien-thoai', 1, NULL);
    PERFORM pg_temp.seed_cat('Ốp lưng và bao da', 'op-lung-bao-da', 'dien-thoai', 2, NULL);
    PERFORM pg_temp.seed_cat('Sạc và cáp', 'sac-cap', 'dien-thoai', 3, NULL);
    PERFORM pg_temp.seed_cat('Tai nghe', 'tai-nghe', 'dien-thoai', 4, NULL);

    PERFORM pg_temp.seed_cat('Máy tính', 'may-tinh', NULL, 7, 'Laptop');
    PERFORM pg_temp.seed_cat('Laptop', 'laptop', 'may-tinh', 1, NULL);
    PERFORM pg_temp.seed_cat('Linh kiện máy tính', 'linh-kien-may-tinh', 'may-tinh', 2, NULL);
    PERFORM pg_temp.seed_cat('Chuột và bàn phím', 'chuot-ban-phim', 'may-tinh', 3, NULL);
    PERFORM pg_temp.seed_cat('Màn hình', 'man-hinh', 'may-tinh', 4, NULL);

    PERFORM pg_temp.seed_cat('Nhà cửa và nội thất', 'nha-cua-noi-that', NULL, 8, 'Sofa');
    PERFORM pg_temp.seed_cat('Nội thất phòng khách', 'noi-that-phong-khach', 'nha-cua-noi-that', 1, NULL);
    PERFORM pg_temp.seed_cat('Nội thất phòng ngủ', 'noi-that-phong-ngu', 'nha-cua-noi-that', 2, NULL);
    PERFORM pg_temp.seed_cat('Đồ dùng nhà bếp', 'do-dung-nha-bep', 'nha-cua-noi-that', 3, NULL);
    PERFORM pg_temp.seed_cat('Đồ trang trí', 'do-trang-tri', 'nha-cua-noi-that', 4, NULL);

    PERFORM pg_temp.seed_cat('Mỹ phẩm', 'my-pham', NULL, 9, 'Sparkles');
    PERFORM pg_temp.seed_cat('Chăm sóc da mặt', 'cham-soc-da-mat', 'my-pham', 1, NULL);
    PERFORM pg_temp.seed_cat('Trang điểm', 'trang-diem', 'my-pham', 2, NULL);
    PERFORM pg_temp.seed_cat('Chăm sóc tóc', 'cham-soc-toc', 'my-pham', 3, NULL);
    PERFORM pg_temp.seed_cat('Nước hoa', 'nuoc-hoa', 'my-pham', 4, NULL);

    PERFORM pg_temp.seed_cat('Đồng hồ', 'dong-ho', NULL, 10, 'Watch');
    PERFORM pg_temp.seed_cat('Đồng hồ nam', 'dong-ho-nam', 'dong-ho', 1, NULL);
    PERFORM pg_temp.seed_cat('Đồng hồ nữ', 'dong-ho-nu', 'dong-ho', 2, NULL);

    PERFORM pg_temp.seed_cat('Thể thao và du lịch', 'the-thao-du-lich', NULL, 11, 'Dumbbell');
    PERFORM pg_temp.seed_cat('Giày thể thao', 'giay-the-thao', 'the-thao-du-lich', 1, NULL);
    PERFORM pg_temp.seed_cat('Quần áo thể thao', 'quan-ao-the-thao', 'the-thao-du-lich', 2, NULL);
    PERFORM pg_temp.seed_cat('Balo và vali', 'balo-vali', 'the-thao-du-lich', 3, NULL);

    PERFORM pg_temp.seed_cat('Mẹ và bé', 'me-va-be', NULL, 12, 'Baby');
    PERFORM pg_temp.seed_cat('Quần áo trẻ em', 'quan-ao-tre-em', 'me-va-be', 1, NULL);
    PERFORM pg_temp.seed_cat('Đồ chơi', 'do-choi', 'me-va-be', 2, NULL);
    PERFORM pg_temp.seed_cat('Sữa và dinh dưỡng', 'sua-dinh-duong', 'me-va-be', 3, NULL);
END $$;
