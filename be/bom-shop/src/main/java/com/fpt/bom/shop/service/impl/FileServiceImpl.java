package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.config.ShopProperties;
import com.fpt.bom.shop.constant.ShopConstants;
import com.fpt.bom.shop.dto.CommonDto.UrlResponse;
import com.fpt.bom.shop.service.FileService;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final Pattern KEY_PATTERN = Pattern
            .compile("^\\d{4}/\\d{2}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp|gif)$");
    private static final Map<String, String> CONTENT_TYPES = Map.of("jpg", "image/jpeg", "png", "image/png",
            "webp", "image/webp", "gif", "image/gif");
    private static final DateTimeFormatter FOLDER = DateTimeFormatter.ofPattern("yyyy/MM");

    private final StorageService storageService;
    private final ShopProperties shopProperties;

    @Override
    public UrlResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BaseException("shop.file.empty");
        }
        if (file.getSize() > ShopConstants.MAX_FILE_BYTES) {
            throw new BaseException("shop.file.tooLarge");
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            log.error("Failed to read uploaded file", e);
            throw new BaseException("shop.file.uploadFailed");
        }
        String extension = detectExtension(content);
        if (extension == null) {
            throw new BaseException("shop.file.typeInvalid");
        }
        String key = LocalDate.now().format(FOLDER) + "/" + UUID.randomUUID() + "." + extension;
        try {
            storageService.putObject(shopProperties.getStorage().getBucket(), key, content);
        } catch (RuntimeException e) {
            log.error("Failed to store file {}", key, e);
            throw new BaseException("shop.file.uploadFailed");
        }
        log.info("Stored shop file: key={}, bytes={}", key, content.length);
        return new UrlResponse(shopProperties.getPublicFileBase() + key);
    }

    @Override
    public StoredFile load(String key) {
        if (key == null || !KEY_PATTERN.matcher(key).matches()) {
            throw new BaseException("APP_DATA404");
        }
        byte[] content;
        try {
            content = storageService.getObject(shopProperties.getStorage().getBucket(), key);
        } catch (RuntimeException e) {
            log.warn("Shop file not available: key={}", key);
            throw new BaseException("APP_DATA404");
        }
        String extension = key.substring(key.lastIndexOf('.') + 1);
        return new StoredFile(content, CONTENT_TYPES.get(extension));
    }

    /** Identifies the image type from its magic bytes, so the client-supplied type/extension is never trusted. */
    private static String detectExtension(byte[] c) {
        if (c.length >= 3 && (c[0] & 0xFF) == 0xFF && (c[1] & 0xFF) == 0xD8 && (c[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (c.length >= 8 && (c[0] & 0xFF) == 0x89 && c[1] == 'P' && c[2] == 'N' && c[3] == 'G') {
            return "png";
        }
        if (c.length >= 6 && c[0] == 'G' && c[1] == 'I' && c[2] == 'F' && c[3] == '8') {
            return "gif";
        }
        if (c.length >= 12 && c[0] == 'R' && c[1] == 'I' && c[2] == 'F' && c[3] == 'F' && c[8] == 'W'
                && c[9] == 'E' && c[10] == 'B' && c[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
