package com.fpt.bom.sa.service.support;

import com.fpt.bom.sa.entity.User;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.Collection;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;
import static com.fpt.core.persistence.spec.JpaStringSpecifications.like;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class UserSpecs {

    public static SpecificationBuilder<User> accountScope(boolean internal) {
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();
        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(eq("isDeleted", false));
        builder.and(eq("isInternal", internal));
        return builder;
    }

    public static void applyAccountFilters(SpecificationBuilder<User> builder, String userName, String personalName,
            String email, Collection<?> status) {
        builder.and(like("userName", userName));
        builder.and(like("personalName", personalName));
        builder.and(like("email", email));
        builder.and(in("status", status));
    }
}
