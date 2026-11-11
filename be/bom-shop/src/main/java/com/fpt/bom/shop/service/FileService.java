package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CommonDto.UrlResponse;
import org.springframework.web.multipart.MultipartFile;

/** Image storage on MinIO under the shop bucket. */
public interface FileService {

    /** A stored object ready to be streamed. */
    record StoredFile(byte[] content, String contentType) {
    }

    /** Validates (image type by content, at most 5 MB) and stores the file; returns its public URL. */
    UrlResponse upload(MultipartFile file);

    /** Loads an object by its key ({@code yyyy/MM/uuid.ext}); 404 when the key is malformed or missing. */
    StoredFile load(String key);
}
