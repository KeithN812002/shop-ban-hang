package com.fpt.res.shop.controller;

import com.fpt.bom.shop.service.FileService;
import com.fpt.bom.shop.service.FileService.StoredFile;
import com.fpt.core.common.annotation.SkipPermissionCheck;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/** Streams stored images; this is the only shop endpoint that does not wrap its payload in a Response. */
@RestController
@RequestMapping("/shop/public/file")
@RequiredArgsConstructor
@SkipPermissionCheck
public class PublicFileController {

    private static final String PREFIX = "/shop/public/file/";

    private final FileService fileService;

    @GetMapping("/**")
    public ResponseEntity<byte[]> file(HttpServletRequest request) {
        String path = request.getServletPath();
        String key = path.startsWith(PREFIX) ? path.substring(PREFIX.length()) : "";
        StoredFile file = fileService.load(key);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(file.content());
    }
}
