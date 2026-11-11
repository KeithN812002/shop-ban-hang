package com.fpt.core.common.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.logging", ignoreUnknownFields = false)
public class AppLoggingProperties {
    private boolean useJsonFormat = false;
    private String jsonPattern;
    private final Logstash logstash = new Logstash();

    @Data
    public static class Logstash {
        private boolean enabled = false;
        private String host;
        private int port = 5000;
        private int ringBufferSize = 512;

        @Deprecated
        public int getQueueSize() {
            return ringBufferSize;
        }

        @Deprecated
        public void setQueueSize(int queueSize) {
            this.ringBufferSize = queueSize;
        }
    }
}

