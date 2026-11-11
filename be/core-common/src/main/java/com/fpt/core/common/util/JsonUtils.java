package com.fpt.core.common.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@UtilityClass
public class JsonUtils {

    private static final ObjectMapper DEFAULT_MAPPER = createDefaultMapper();

    private static ObjectMapper createDefaultMapper() {
        return JsonMapper.builderWithJackson2Defaults()
                .changeDefaultPropertyInclusion(incl -> JsonInclude.Value.construct(Include.NON_NULL, Include.NON_NULL))
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
    }

    public static byte[] writeValueAsBytes(Object obj) {
        if (obj == null) {
            return new byte[0];
        }
        try {
            return DEFAULT_MAPPER.writeValueAsBytes(obj);
        } catch (JacksonException e) {
            log.error("Failed to serialize object to JSON bytes", e);
            return new byte[0];
        }
    }

    public static String convertObjectToJsonString(Object obj) {
        if (obj == null) {
            return "";
        }
        try {
            return DEFAULT_MAPPER.writeValueAsString(obj);
        } catch (JacksonException e) {
            log.error("Failed to serialize object to JSON string", e);
            return "";
        }
    }

    public static <T> T convertJsonStringtoObject(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty() || clazz == null) {
            return null;
        }
        try {
            return DEFAULT_MAPPER.readValue(json, clazz);
        } catch (Exception e) {
            log.error("Failed to deserialize JSON to {}", clazz.getSimpleName(), e);
            return null;
        }
    }

    public static Map<String, Object> convertJsonStringToMap(String jsonInString) {
        if (jsonInString == null || jsonInString.trim().isEmpty()) {
            return new HashMap<>();
        }
        try {
            return DEFAULT_MAPPER.readValue(
                    jsonInString,
                    new TypeReference<>() {
                    });
        } catch (Exception e) {
            log.error("Failed to deserialize JSON to Map<String, Object>", e);
            return new HashMap<>();
        }
    }

    public static <T> List<T> convertJsonStringToList(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        try {
            return DEFAULT_MAPPER.readValue(json, typeReference);
        } catch (Exception e) {
            log.error("Failed to deserialize JSON to List", e);
            return java.util.Collections.emptyList();
        }
    }
}
