package com.fpt.core.cache.service;

public interface CacheService {

    void setString(String key, String value, Integer expire);

    String getString(String key);

    void delete(String key);

    void deleteByPattern(String pattern);

}

