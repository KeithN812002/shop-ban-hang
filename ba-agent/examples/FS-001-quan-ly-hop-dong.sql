-- =====================================================================
-- FS-001 Quản lý hợp đồng — DDL PostgreSQL
-- Version : 1.0 (khớp FS-001 v1.0)
-- Chế độ  : B — tự thiết kế (mục 7.0 của FS)
-- Ghi chú : Core chưa có Flyway/Liquibase. Script chạy lại được nhiều lần,
--           không có DROP. Cột audit khớp EntityBase / EntitySoftDeleteBase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENT-01 ct_contract — Hợp đồng (EntitySoftDeleteBase)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ct_contract (
    id                uuid           NOT NULL,
    code              varchar(20)    NOT NULL,
    name              varchar(255)   NOT NULL,
    partner_name      varchar(255)   NOT NULL,
    partner_tax_code  varchar(14)    NOT NULL,
    sign_date         date           NOT NULL,
    effective_from    date           NOT NULL,
    effective_to      date           NOT NULL,
    value             numeric(18,2)  NOT NULL,
    currency          varchar(3)     NOT NULL DEFAULT 'VND',
    description       varchar(2000),
    unit_id           uuid           NOT NULL,
    status            varchar(20)    NOT NULL DEFAULT 'DRAFT',
    submitted_at      timestamp,
    approved_by       varchar(50),
    approved_at       timestamp,
    reason            varchar(1000),
    -- EntityBase
    created_date      timestamp      NOT NULL,
    created_by        varchar(50)    NOT NULL,
    updated_date      timestamp      NOT NULL,
    updated_by        varchar(50)    NOT NULL,
    -- EntitySoftDeleteBase
    is_deleted        boolean        NOT NULL DEFAULT false,
    deleted_date      timestamp,
    deleted_by        varchar(50),
    CONSTRAINT pk_ct_contract PRIMARY KEY (id),
    CONSTRAINT uk_ct_contract_code UNIQUE (code),
    CONSTRAINT ck_ct_contract_tax_code CHECK (partner_tax_code ~ '^\d{10}(-\d{3})?$'),
    CONSTRAINT ck_ct_contract_value CHECK (value > 0),
    CONSTRAINT ck_ct_contract_effective CHECK (effective_to >= effective_from),
    CONSTRAINT ck_ct_contract_sign_date CHECK (sign_date <= effective_from),
    CONSTRAINT ck_ct_contract_currency CHECK (currency IN ('VND', 'USD')),
    CONSTRAINT ck_ct_contract_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'RETURNED', 'APPROVED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_ct_contract_unit_status ON ct_contract (unit_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_ct_contract_tax_code ON ct_contract (partner_tax_code);

COMMENT ON TABLE  ct_contract IS 'Hợp đồng (FS-001 ENT-01)';
COMMENT ON COLUMN ct_contract.code IS 'Mã tự sinh HD-yyyy-NNNNN (BR-01)';
COMMENT ON COLUMN ct_contract.partner_tax_code IS 'Mã số thuế đối tác: 10 số hoặc 10 số-3 số (BR-03)';
COMMENT ON COLUMN ct_contract.unit_id IS 'Đơn vị sở hữu, lấy từ token khi tạo; dùng để phân quyền dữ liệu (BR-09)';
COMMENT ON COLUMN ct_contract.status IS 'DRAFT | PENDING_APPROVAL | RETURNED | APPROVED | CANCELLED';
COMMENT ON COLUMN ct_contract.submitted_at IS 'Lần trình gần nhất; rỗng = chưa từng trình (BR-08)';
COMMENT ON COLUMN ct_contract.reason IS 'Lý do trả lại / huỷ gần nhất; đầy đủ trong ct_contract_history';

-- ---------------------------------------------------------------------
-- ENT-02 ct_contract_attachment — File đính kèm (EntityBase)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ct_contract_attachment (
    id            uuid          NOT NULL,
    contract_id   uuid,
    file_name     varchar(255)  NOT NULL,
    object_key    varchar(500)  NOT NULL,
    content_type  varchar(100)  NOT NULL,
    size_bytes    bigint        NOT NULL,
    created_date  timestamp     NOT NULL,
    created_by    varchar(50)   NOT NULL,
    updated_date  timestamp     NOT NULL,
    updated_by    varchar(50)   NOT NULL,
    CONSTRAINT pk_ct_contract_attachment PRIMARY KEY (id),
    CONSTRAINT fk_ct_contract_attachment_contract_id FOREIGN KEY (contract_id) REFERENCES ct_contract (id),
    CONSTRAINT ck_ct_contract_attachment_size CHECK (size_bytes > 0 AND size_bytes <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_ct_contract_attachment_contract_id ON ct_contract_attachment (contract_id);
CREATE INDEX IF NOT EXISTS idx_ct_contract_attachment_temp ON ct_contract_attachment (created_date) WHERE contract_id IS NULL;

COMMENT ON TABLE  ct_contract_attachment IS 'File đính kèm hợp đồng (FS-001 ENT-02)';
COMMENT ON COLUMN ct_contract_attachment.contract_id IS 'Rỗng = file tạm chưa gắn hợp đồng; job dọn sau 24 giờ (Q-04)';
COMMENT ON COLUMN ct_contract_attachment.object_key IS 'Khoá đối tượng trên MinIO; không lộ ra FE';

-- ---------------------------------------------------------------------
-- ENT-03 ct_contract_history — Lịch sử thao tác (EntityBase, chỉ thêm)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ct_contract_history (
    id             uuid           NOT NULL,
    contract_id    uuid           NOT NULL,
    action         varchar(20)    NOT NULL,
    source         varchar(30)    NOT NULL,
    status_before  varchar(20),
    status_after   varchar(20)    NOT NULL,
    note           varchar(1000),
    created_date   timestamp      NOT NULL,
    created_by     varchar(50)    NOT NULL,
    updated_date   timestamp      NOT NULL,
    updated_by     varchar(50)    NOT NULL,
    CONSTRAINT pk_ct_contract_history PRIMARY KEY (id),
    CONSTRAINT fk_ct_contract_history_contract_id FOREIGN KEY (contract_id) REFERENCES ct_contract (id),
    CONSTRAINT ck_ct_contract_history_action CHECK (action IN ('CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'RETURN', 'CANCEL')),
    CONSTRAINT ck_ct_contract_history_source CHECK (source IN ('CONTRACT_LIST', 'CONTRACT_DETAIL'))
);

CREATE INDEX IF NOT EXISTS idx_ct_contract_history_contract ON ct_contract_history (contract_id, created_date);

COMMENT ON TABLE ct_contract_history IS 'Lịch sử thao tác hợp đồng, chỉ thêm (FS-001 ENT-03)';

-- ---------------------------------------------------------------------
-- ENT-04 ct_contract_code_counter — Bộ đếm mã theo năm (bảng kỹ thuật)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ct_contract_code_counter (
    year        integer  NOT NULL,
    last_value  integer  NOT NULL DEFAULT 0,
    CONSTRAINT pk_ct_contract_code_counter PRIMARY KEY (year),
    CONSTRAINT ck_ct_contract_code_counter_value CHECK (last_value >= 0)
);

COMMENT ON TABLE ct_contract_code_counter IS 'Bộ đếm sinh mã HD-yyyy-NNNNN (FS-001 ENT-04, BR-01)';

-- Câu lệnh service dùng để cấp số tiếp theo (an toàn khi đồng thời):
--   INSERT INTO ct_contract_code_counter (year, last_value) VALUES (:year, 1)
--   ON CONFLICT (year) DO UPDATE SET last_value = ct_contract_code_counter.last_value + 1
--   RETURNING last_value;
