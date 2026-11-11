package com.fpt.core.storage.service.impl;

import com.fpt.core.common.constant.Constants;
import com.fpt.core.storage.config.MinioProperties;
import com.fpt.core.storage.exception.StorageException;
import com.fpt.core.storage.service.StorageService;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
@Qualifier("MinioStorageServiceImpl")
@RequiredArgsConstructor
@Slf4j
public class StorageServiceImpl implements StorageService {

    private final MinioProperties minioProperties;
    private MinioClient minioClient;

    @PostConstruct
    public void init() {
        String minioUrl = minioProperties.getHostUrl();
        String accessKey = minioProperties.getAccessName();
        String accessSecret = minioProperties.getAccessSecret();

        if (minioUrl == null || minioUrl.trim().isEmpty()
                || accessKey == null || accessKey.trim().isEmpty()
                || accessSecret == null || accessSecret.trim().isEmpty()) {
            log.error("MinIO configuration is incomplete. minioUrl/accessKey/accessSecret must not be empty");
            throw new IllegalStateException(
                    "MinIO configuration is incomplete. Please check minio.host-url, minio.access-name, and minio.access-secret");
        }

        try {
            minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, accessSecret)
                    .build();
        } catch (Exception e) {
            log.error("Failed to initialize MinIO client", e);
            throw new IllegalStateException("Failed to initialize MinIO client: " + e.getMessage(), e);
        }
    }

    @Override
    public String putObject(String bucketName, String folderPath, String originalFileName, byte[] content)
            throws StorageException {
        validateBucketExists(bucketName);
        validateObjectName(originalFileName);

        String objectName = buildObjectName(folderPath, originalFileName);
        putObject(bucketName, objectName, content);
        return objectName;
    }

    @Override
    public void putObject(String bucketName, String objectName, byte[] content) throws StorageException {
        log.info("Starting upload object: {} to bucket: {}", objectName, bucketName);
        validateObjectName(objectName);

        if (content == null || content.length == 0) {
            log.error("Content is null or empty for object: {} in bucket: {}", objectName, bucketName);
            throw new StorageException("errors.storage.minio.content.empty");
        }

        validateBucketExists(bucketName);
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(content)) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, (long) content.length, (long) Constants.MINIO.PUT_OBJECT_PART_SIZE)
                    .build());
            log.info("Completed upload object: {} to bucket: {}", objectName, bucketName);
        } catch (Exception e) {
            log.error("Failed to upload object: {} to bucket: {}", objectName, bucketName, e);
            throw new StorageException("errors.storage.minio.upload.failed", e);
        }
    }

    @Override
    public byte[] getObject(String bucketName, String objectName) throws StorageException {
        log.info("Starting get object: {} from bucket: {}", objectName, bucketName);
        validateObjectName(objectName);

        validateBucketExists(bucketName);

        try (InputStream inputStream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build())) {

            byte[] result = IOUtils.toByteArray(inputStream);
            log.info("Completed get object: {} from bucket: {}", objectName, bucketName);
            return result;
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to get object: {} from bucket: {}", objectName, bucketName, e);
            throw new StorageException("errors.storage.minio.get.failed", e);
        }
    }

    @Override
    public void removeObject(String bucketName, String objectName) throws StorageException {
        log.info("Starting remove object: {} from bucket: {}", objectName, bucketName);
        validateObjectName(objectName);

        validateBucketExists(bucketName);

        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            log.info("Completed remove object: {} from bucket: {}", objectName, bucketName);
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to remove object: {} from bucket: {}", objectName, bucketName, e);
            throw new StorageException("errors.storage.minio.remove.failed", e);
        }
    }

    private String buildObjectName(String folderPath, String originalFileName) {
        String safeFolder = normalizePath(folderPath);
        String safeFileName = sanitizeFileName(originalFileName);
        String uniquePrefix = UUID.randomUUID().toString();

        if (safeFolder.isEmpty()) {
            return uniquePrefix + "_" + safeFileName;
        }
        return safeFolder + "/" + uniquePrefix + "_" + safeFileName;
    }

    private String normalizePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return "";
        }
        String normalized = path.trim().replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new StorageException("errors.storage.minio.object.name.empty");
        }

        String normalized = Normalizer.normalize(fileName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("_+", "_")
                .toLowerCase(Locale.ROOT)
                .trim();

        if (normalized.isEmpty() || ".".equals(normalized) || "..".equals(normalized)) {
            throw new StorageException("errors.storage.minio.object.name.empty");
        }
        return normalized;
    }

    private void validateBucketExists(String bucketName) throws StorageException {
        validateBucketName(bucketName);

        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                log.info("Bucket does not exist, creating bucket: {}", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to check bucket existence: {}", bucketName, e);
            throw new StorageException("errors.storage.minio.bucket.check.failed", e);
        }
    }

    private void validateBucketName(String bucketName) throws StorageException {
        if (bucketName == null || bucketName.trim().isEmpty()) {
            log.error("Bucket name is null or empty");
            throw new StorageException("errors.storage.minio.bucket.name.empty");
        }
    }

    private void validateObjectName(String objectName) throws StorageException {
        if (objectName == null || objectName.trim().isEmpty()) {
            log.error("Object name is null or empty");
            throw new StorageException("errors.storage.minio.object.name.empty");
        }
    }
}