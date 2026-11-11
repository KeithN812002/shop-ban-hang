package com.fpt.bom.shop.dto;

import com.fpt.core.common.dto.PagingBase;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Small shared request/response shapes. */
public final class CommonDto {

    private CommonDto() {
    }

    /** Action on a record that may carry a free-text reason (reject, cancel, ban...). */
    public record ReasonRequest(
            @NotNull(message = "{common.id.notNull}") UUID id,
            @Size(max = 500, message = "{shop.validation.size}") String reason) {
    }

    public record StoreRef(UUID id, String name) {
    }

    /** Plain paging parameters (page number/size, optional sort) for listings without extra filters. */
    @Getter
    @Setter
    public static class PagingFilter extends PagingBase {
    }

    public record UrlResponse(String url) {
    }
}
