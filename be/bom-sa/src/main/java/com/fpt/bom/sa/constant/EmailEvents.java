package com.fpt.bom.sa.constant;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Email event type codes used by system administration. Event types are plain string codes
 * matched against {@code sa_email_template.event_type}; projects add their own codes freely.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class EmailEvents {

    public static final String CREATE_USER = "CREATE_USER";
    public static final String UPDATE_USER = "UPDATE_USER";
    public static final String RESET_PASSWORD = "RESET_PASSWORD";
    public static final String OTP_CHANGE_PASSWORD = "OTP_CHANGE_PASSWORD";
}
