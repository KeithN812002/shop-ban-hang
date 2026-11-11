package com.fpt.core.common.web;

import jakarta.servlet.http.HttpServletRequest;

import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;

import com.fpt.core.common.constant.Constants;

@UtilityClass
public class RequestClientInfo {

    public String getReferer(HttpServletRequest request) {
        return request.getHeader(Constants.REQUEST_HEADER.REFERER);
    }

    public String getUrlWithQueryString(HttpServletRequest request) {
        StringBuffer requestURL = request.getRequestURL();
        String queryString = request.getQueryString();

        if (queryString == null) {
            return requestURL.toString();
        }
        return requestURL.append('?').append(queryString).toString();
    }

    public String getClientIpAddr(HttpServletRequest request) {
        String ip = getHeaderValue(request, Constants.REQUEST_HEADER.X_FORWARDED_FOR);
        if (isValidIp(ip)) {
            return ip;
        }

        ip = getHeaderValue(request, Constants.REQUEST_HEADER.PROXY_CLIENT_IP);
        if (isValidIp(ip)) {
            return ip;
        }

        ip = getHeaderValue(request, Constants.REQUEST_HEADER.WL_PROXY_CLIENT_IP);
        if (isValidIp(ip)) {
            return ip;
        }

        ip = getHeaderValue(request, Constants.REQUEST_HEADER.HTTP_CLIENT_IP);
        if (isValidIp(ip)) {
            return ip;
        }

        ip = getHeaderValue(request, Constants.REQUEST_HEADER.HTTP_X_FORWARDED_FOR);
        if (isValidIp(ip)) {
            return ip;
        }

        return request.getRemoteAddr();
    }

    public String getUserAgent(HttpServletRequest request) {
        return request.getHeader(Constants.REQUEST_HEADER.USER_AGENT);
    }

    public String getHttpMethodAndUrlWithoutQueryString(HttpServletRequest request) {
        return getHttpMethodAndUrlWithoutQueryString(request.getMethod(), request.getRequestURI());
    }

    public String getHttpMethodAndUrlWithoutQueryString(String method, String url) {
        if (url == null) {
            return String.format(Constants.URL.FORMAT_METHOD_URL, method, null);
        }

        String processedUrl = StringUtils.trim(url);
        if (StringUtils.isEmpty(processedUrl)) {
            return String.format(Constants.URL.FORMAT_METHOD_URL, method, null);
        }

        if (processedUrl.contains(Constants.URL.V1_PREFIX)) {
            processedUrl = processedUrl.substring(
                    processedUrl.indexOf(Constants.URL.V1_PREFIX) + Constants.URL.V1_PREFIX.length());
        }

        if (processedUrl.contains(Constants.URL.QUERY_SEPARATOR)) {
            processedUrl = processedUrl.substring(0, processedUrl.indexOf(Constants.URL.QUERY_SEPARATOR));
        }

        while (processedUrl.endsWith(Constants.URL.PATH_SEPARATOR)) {
            processedUrl = processedUrl.substring(0, processedUrl.length() - 1);
        }

        return String.format(Constants.URL.FORMAT_METHOD_URL, method, processedUrl);
    }

    private String getHeaderValue(HttpServletRequest request, String headerName) {
        return request.getHeader(headerName);
    }

    private boolean isValidIp(String ip) {
        return ip != null
                && !ip.isEmpty()
                && !Constants.HTTP_RESPONSE.UNKNOWN_IP.equalsIgnoreCase(ip);
    }
}
