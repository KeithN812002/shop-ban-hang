package com.fpt.bom.shop.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReturnReason {
    DAMAGED("Hàng bị hư hỏng"),
    WRONG_ITEM("Giao sai hàng"),
    NOT_AS_DESCRIBED("Không đúng mô tả"),
    MISSING_PARTS("Thiếu hàng / phụ kiện"),
    OTHER("Lý do khác");

    /** Vietnamese label written into the order history note (stored text is Vietnamese, like notifications). */
    private final String label;
}
