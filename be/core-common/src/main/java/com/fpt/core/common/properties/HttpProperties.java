package com.fpt.core.common.properties;

import com.fpt.core.common.constant.Constants;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;

@Data
@NoArgsConstructor
public class HttpProperties {
    private Duration connectTimeout = Duration.ofSeconds(Constants.HTTP_TIMEOUT.CONNECT_TIMEOUT_SECONDS);
    private Duration readTimeout = Duration.ofSeconds(Constants.HTTP_TIMEOUT.READ_TIMEOUT_SECONDS);
}
