package com.fpt.core.storage.service;

import com.fpt.core.storage.exception.StorageException;

public interface StorageService {

    String putObject(String bucketName, String folderPath, String originalFileName, byte[] content) throws StorageException;

    void putObject(String bucketName, String objectName, byte[] content) throws StorageException;

    byte[] getObject(String bucketName, String objectName) throws StorageException;

    void removeObject(String bucketName, String objectName) throws StorageException;
}
