package com.fpt.core.server.config.app;

import ch.qos.logback.classic.LoggerContext;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.fpt.core.common.log.LoggingUtils;
import com.fpt.core.common.properties.AppLoggingProperties;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoggingConfiguration {

    public LoggingConfiguration(
        @Value("${spring.application.name}") String appName,
        @Value("${server.port}") String serverPort,
        AppLoggingProperties loggingProperties,
        ObjectProvider<BuildProperties> buildProperties,
        ObjectMapper mapper
    ) throws JacksonException {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();

        Map<String, String> map = new HashMap<>();
        map.put("app_name", appName);
        map.put("app_port", serverPort);
        buildProperties.ifAvailable(it -> map.put("version", it.getVersion()));
        String customFields = mapper.writeValueAsString(map);

        AppLoggingProperties.Logstash logstashProperties = loggingProperties.getLogstash();

        if (loggingProperties.isUseJsonFormat()) {
            LoggingUtils.addJsonConsoleAppender(context, customFields, loggingProperties);
        }
        if (logstashProperties.isEnabled()) {
            LoggingUtils.addLogstashTcpSocketAppender(context, customFields, loggingProperties);
        }
        if (loggingProperties.isUseJsonFormat() || logstashProperties.isEnabled()) {
            LoggingUtils.addContextListener(context, customFields, loggingProperties);
        }
    }
}
