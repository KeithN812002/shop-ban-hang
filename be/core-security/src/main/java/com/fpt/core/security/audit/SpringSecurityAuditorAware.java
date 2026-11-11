package com.fpt.core.security.audit;

import java.util.Objects;
import java.util.Optional;

import org.springframework.data.domain.AuditorAware;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;

import com.fpt.core.security.util.SecurityUtils;

@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {

    @NonNull
    @Override
    public Optional<String> getCurrentAuditor() {
        return Objects.requireNonNull(Optional.of(SecurityUtils.getCurrentUsername()));
    }
}
