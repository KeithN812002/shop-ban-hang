package com.fpt.core.common.constant;

import com.fpt.core.common.enums.AppEnum;
import com.fpt.core.common.enums.LanguageEnum;
import com.fpt.core.common.enums.TimeEnum;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Constants {

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class SECURITY_FILTER {
        public static final String ERROR_CODE_UNAUTHORIZED = "SYS_00002";
        public static final String ERROR_CODE_ACCESS_DENIED = "SYS_00004";
        public static final String ERROR_CODE_API_NOT_FOUND = "SYS_00013";
        public static final String ERROR_CODE_TOKEN_REVOKED = "SYS_00014";

        public static final String REDIS_KEY_TOKEN_BLACKLIST_PREFIX = "token:blacklist:";
        public static final String REDIS_KEY_USER_BLACKLIST_PREFIX = "token:blacklist:user:";
        public static final int USER_BLACKLIST_DEFAULT_TTL_SECONDS = 900;

        public static final String ACTUATOR_PATH = "/actuator";
        public static final String ACTUATOR_PATH_PREFIX = "/actuator/";

        public static final String SPRING_HANDLER_MAPPING_BEAN_NAME = "requestMappingHandlerMapping";

        public static final String SERVICE_ACCOUNT_USERNAME_PREFIX = "service-account-";

        public static final String JWT_JTI = "jti";
        public static final String JWT_ISS = "iss";
        public static final String JWT_EXP = "exp";
        public static final String JWT_IAT = "iat";
        public static final String JWT_AZP = "azp";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class SECURITY {
        public static final String UNKNOWN_USER = "unknown";
        public static final String UNASSIGNED = "unassigned";
        public static final String AES_ALGORITHM = "AES/GCM/NoPadding";
        public static final String AES_KEY_ALGORITHM = "AES";
        public static final int AES_GCM_IV_LENGTH = 12;
        public static final int AES_GCM_TAG_LENGTH = 128;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class AUTH {
        public static final String REDIS_KEY_AUTH_CODE_PREFIX = "auth:authcode:";
        public static final int AUTH_CODE_CACHE_TTL_SECONDS = 120;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class PASSWORD {
        public static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        public static final String LOWER = "abcdefghijkmnpqrstuvwxyz";
        public static final String DIGIT = "23456789";
        public static final String SPECIAL = "@#$%&*";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class HTTP_TIMEOUT {
        public static final long CONNECT_TIMEOUT_SECONDS = 10L;
        public static final long READ_TIMEOUT_SECONDS = 30L;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class REDIS {
        public static final String DEFAULT_TIME_UNIT = TimeEnum.SECONDS.getCode();
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class MINIO {
        public static final int PUT_OBJECT_PART_SIZE = 10 * 1024 * 1024; // 10MB
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class REQUEST_HEADER {
        public static final String BEARER = "Bearer ";
        public static final String REFERER = "referer";
        public static final String USER_AGENT = "User-Agent";
        public static final String X_FORWARDED_FOR = "X-Forwarded-For";
        public static final String PROXY_CLIENT_IP = "Proxy-Client-IP";
        public static final String WL_PROXY_CLIENT_IP = "WL-Proxy-Client-IP";
        public static final String HTTP_CLIENT_IP = "HTTP_CLIENT_IP";
        public static final String HTTP_X_FORWARDED_FOR = "HTTP_X_FORWARDED_FOR";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class HTTP_RESPONSE {
        public static final String OK = "OK";
        public static final String UNKNOWN_IP = "unknown";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class LOCALE {
        public static final String DEFAULT_LANGUAGE_TAG = LanguageEnum.VI.getCode();
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class LOCALIZATION {
        public static final String MESSAGE_BASENAME = "messages";
        public static final String DEFAULT_ENCODING = "UTF-8";
        public static final boolean FALLBACK_TO_SYSTEM_LOCALE = false;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class LOGGING {
        public static final String CONSOLE_APPENDER_NAME = "CONSOLE";
        public static final String ASYNC_LOGSTASH_APPENDER_NAME = "ASYNC_LOGSTASH";
        public static final String GLOBAL_EXCEPTION_HANDLER_LOGGER_NAME = "com.fpt.api.handler.GlobalExceptionHandler";
        public static final String TIMEZONE_UTC = "UTC";
        public static final String MDC_METHOD_NAME = "method_name";
        public static final String MDC_DURATION_MS = "duration_ms";
        public static final String FIELD_NAME_TIMESTAMP = "timestamp";
        public static final String FIELD_NAME_STACK_TRACE = "stackTrace";
        public static final String FIELD_NAME_EXCEPTION_CLASS = "exceptionClass";
        public static final int SHORTENED_LOGGER_NAME_LENGTH = 20;
        public static final int MAX_DEPTH_PER_THROWABLE = 30;
        public static final int MAX_STACK_TRACE_LENGTH = 20000;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class REGEX {
        public static final String EMAIL = "^$|^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
                + "(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}$";
        public static final String USER_NAME = "^[a-z0-9]+([._-][a-z0-9]+)*$";
        public static final String PHONE = "^$|^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+\\-().\\s]+$";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class DATE_PATTERN {
        public static final String DAY = "dd";
        public static final String MONTH = "MM";
        public static final String YEAR = "yyyy";
        public static final String DATE = "dd/MM/yyyy";
        public static final String TIME = "HH:mm";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class URL {
        public static final String V1_PREFIX = "/v1/";
        public static final String QUERY_SEPARATOR = "?";
        public static final String PATH_SEPARATOR = "/";
        public static final String FORMAT_METHOD_URL = "[%s]%s";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class PAGINATION {
        public static final String DEFAULT_SORT_FIELD = "createdDate";
        public static final String SORT_TYPE_ASC = "ASC";
        public static final String SORT_TYPE_DESC = "DESC";
        public static final int DEFAULT_PAGE = 1;
        public static final int DEFAULT_PAGE_SIZE = 10;
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class JWT_CLAIMS {
        public static final String USER_ID = "sub";
        public static final String USER_NAME = "preferred_username";
    }

    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static final class APP {
        public static final String CORE_APP = AppEnum.CORE_APP.getCode();
    }

}
