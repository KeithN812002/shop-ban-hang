package com.fpt.bom.shop.service.support;

import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.repository.ShipperRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Resolves the caller and asserts the roles the shop endpoints require (ownership is never taken from the body). */
@Component
@RequiredArgsConstructor
public class AccessSupport {

    private final StoreRepository storeRepository;
    private final ShipperRepository shipperRepository;

    public String currentUsername() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null || username.isBlank() || Constants.SECURITY.UNKNOWN_USER.equals(username)) {
            throw new BaseException("handler.error.unauthorized");
        }
        return username;
    }

    /** Username of an authenticated caller, or null for anonymous requests. */
    public String optionalUsername() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null || username.isBlank() || Constants.SECURITY.UNKNOWN_USER.equals(username)
                || "anonymousUser".equals(username)) {
            return null;
        }
        return username;
    }

    /** The caller's own store, whatever its status. */
    public Store requireOwnStore(String username) {
        return storeRepository.findByOwnerUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new BaseException("shop.store.notFound"));
    }

    public Store requireActiveStore(String username) {
        Store store = storeRepository.findByOwnerUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new BaseException("shop.store.notActive"));
        if (store.getStatus() != ApprovalStatus.ACTIVE) {
            throw new BaseException("shop.store.notActive");
        }
        return store;
    }

    public Shipper requireActiveShipper(String username) {
        Shipper shipper = shipperRepository.findByUsername(username)
                .orElseThrow(() -> new BaseException("shop.shipper.notActive"));
        if (shipper.getStatus() != ApprovalStatus.ACTIVE) {
            throw new BaseException("shop.shipper.notActive");
        }
        return shipper;
    }
}
