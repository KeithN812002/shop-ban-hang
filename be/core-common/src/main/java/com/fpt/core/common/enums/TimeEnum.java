package com.fpt.core.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@SuppressWarnings("unused")
@Getter
@AllArgsConstructor
public enum TimeEnum {
    MILLISECONDS("MILLISECONDS"),
    SECONDS("SECONDS"),
    MINUTES("MINUTES"),
    HOURS("HOURS"),
    DAYS("DAYS");

    private final String code;

}
