package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.AccountDto.ProfileResponse;
import com.fpt.bom.shop.dto.AccountDto.RegisterRequest;
import com.fpt.bom.shop.dto.AdminDto.AccountFilter;
import com.fpt.bom.shop.dto.AdminDto.AccountResponse;
import com.fpt.core.common.dto.PageResult;

public interface AccountService {

    /** Self-registration: creates the Keycloak user and the external {@code sa_user} row. */
    void register(RegisterRequest request);

    ProfileResponse profile();

    /** Admin listing of external users with their store/shipper role and order totals. */
    PageResult<AccountResponse> adminSearch(AccountFilter filter);
}
