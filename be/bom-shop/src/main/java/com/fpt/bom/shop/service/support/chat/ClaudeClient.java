package com.fpt.bom.shop.service.support.chat;

import com.fpt.bom.shop.config.ShopProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal Anthropic Messages API client (POST /v1/messages with x-api-key and anthropic-version headers).
 * Any transport, HTTP or parsing problem is reported as an {@link IllegalStateException} so the caller can fall
 * back to the rule-based engine.
 */
@Slf4j
@Component
public class ClaudeClient {

    private static final String API_VERSION = "2023-06-01";
    private static final int MAX_TOKENS = 1024;

    private final ShopProperties shopProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public ClaudeClient(ShopProperties shopProperties, ObjectMapper objectMapper) {
        this.shopProperties = shopProperties;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofSeconds(shopProperties.getAi().getTimeoutSeconds());
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isConfigured() {
        String key = shopProperties.getAi().getAnthropicApiKey();
        return key != null && !key.isBlank();
    }

    /** Sends one turn and returns the parsed response object ({@code content}, {@code stop_reason}, ...). */
    public Map<String, Object> createMessage(String system, List<Map<String, Object>> messages,
            List<Map<String, Object>> tools) {
        ShopProperties.Ai ai = shopProperties.getAi();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ai.getModel());
        body.put("max_tokens", MAX_TOKENS);
        body.put("system", system);
        body.put("messages", messages);
        body.put("tools", tools);
        try {
            String response = restClient.post()
                    .uri(ai.getBaseUrl().replaceAll("/+$", "") + "/v1/messages")
                    .header("x-api-key", ai.getAnthropicApiKey())
                    .header("anthropic-version", API_VERSION)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.writeValueAsString(body))
                    .retrieve()
                    .body(String.class);
            if (response == null || response.isBlank()) {
                throw new IllegalStateException("Empty response from the AI service");
            }
            return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {
            });
        } catch (IllegalStateException e) {
            throw e;
        } catch (RuntimeException e) {
            // The message is logged without the request (it carries the API key header only, never the body).
            log.warn("AI request failed: {}", e.getMessage());
            throw new IllegalStateException("AI request failed", e);
        }
    }
}
