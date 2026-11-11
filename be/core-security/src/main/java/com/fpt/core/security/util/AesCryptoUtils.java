package com.fpt.core.security.util;

import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.properties.AppSsoProperties;
import jakarta.annotation.PostConstruct;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AesCryptoUtils {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AppSsoProperties appSsoProperties;

    private SecretKeySpec keySpec;

    @PostConstruct
    public void init() {
        if (appSsoProperties == null || appSsoProperties.getEmail() == null
                || appSsoProperties.getEmail().getCrypto() == null
                || appSsoProperties.getEmail().getCrypto().getKey() == null) {
            throw new IllegalStateException("AES crypto configuration is not initialized");
        }
        String key = appSsoProperties.getEmail().getCrypto().getKey();
        this.keySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), Constants.SECURITY.AES_KEY_ALGORITHM);
    }

    public String encrypt(String value) {
        if (value == null) return null;
        if (value.startsWith("ENC:")) return value;

        try {
            byte[] iv = new byte[Constants.SECURITY.AES_GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(Constants.SECURITY.AES_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(Constants.SECURITY.AES_GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] combined = ByteBuffer.allocate(iv.length + encrypted.length)
                    .put(iv)
                    .put(encrypted)
                    .array();
            return "ENC:" + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption error", e);
        }
    }

    public String decrypt(String value) {
        if (value == null) return null;
        if (!value.startsWith("ENC:")) return value;

        try {
            byte[] combined = Base64.getDecoder().decode(value.substring(4));
            ByteBuffer buffer = ByteBuffer.wrap(combined);
            byte[] iv = new byte[Constants.SECURITY.AES_GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            Cipher cipher = Cipher.getInstance(Constants.SECURITY.AES_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(Constants.SECURITY.AES_GCM_TAG_LENGTH, iv));
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption error", e);
        }
    }
}
