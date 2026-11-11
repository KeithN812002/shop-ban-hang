package com.fpt.bom.sa.service.support;

import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.enums.MethodEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Author: hoanglm21@fpt.com
 * Date: 28/09/26
 */
@Component
@RequiredArgsConstructor
public class EndpointCatalog {

    private final ApplicationContext applicationContext;

    private volatile List<Endpoint> endpoints;

    public boolean isUnknown(MethodEnum method, String uri) {
        if (method == null || uri == null || uri.isBlank()) {
            return true;
        }
        String path = normalizePath(uri);
        RequestMethod requestMethod = RequestMethod.valueOf(method.name());
        return endpoints().stream()
                .filter(e -> e.methods().isEmpty() || e.methods().contains(requestMethod))
                .noneMatch(e -> e.pattern().matcher(path).matches());
    }

    public static String normalizePath(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String path = value.trim();
        int query = path.indexOf('?');
        if (query >= 0) {
            path = path.substring(0, query);
        }
        path = ("/" + path).replaceAll("/{2,}", "/");
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }

    private List<Endpoint> endpoints() {
        List<Endpoint> cached = endpoints;
        if (cached == null) {
            RequestMappingHandlerMapping mapping = applicationContext.getBean(
                    Constants.SECURITY_FILTER.SPRING_HANDLER_MAPPING_BEAN_NAME, RequestMappingHandlerMapping.class);
            cached = mapping.getHandlerMethods().keySet().stream()
                    .flatMap(info -> info.getPatternValues().stream()
                            .map(pattern -> new Endpoint(methodsOf(info), toRegex(pattern))))
                    .toList();
            endpoints = cached;
        }
        return cached;
    }

    private static Set<RequestMethod> methodsOf(RequestMappingInfo info) {
        return info.getMethodsCondition().getMethods();
    }

    private static Pattern toRegex(String pattern) {
        String[] literals = normalizePath(pattern).split("\\{[^}]+}", -1);
        StringBuilder regex = new StringBuilder("^");
        for (int i = 0; i < literals.length; i++) {
            if (i > 0) {
                regex.append("[^/]+");
            }
            regex.append(Pattern.quote(literals[i]));
        }
        return Pattern.compile(regex.append("$").toString());
    }

    private record Endpoint(Set<RequestMethod> methods, Pattern pattern) {
    }
}
