package com.fpt.core.storage.config;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@NoArgsConstructor
@Component
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {
    private String hostUrl;
    private String accessName;
    private String accessSecret;
}

