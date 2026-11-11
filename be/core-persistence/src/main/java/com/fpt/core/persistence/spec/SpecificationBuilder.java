package com.fpt.core.persistence.spec;

import org.springframework.data.jpa.domain.Specification;

public class SpecificationBuilder<T> {

    private Specification<T> spec = Specification.unrestricted();

    public SpecificationBuilder<T> and(Specification<T> other) {
        if (other != null) {
            spec = spec.and(other);
        }
        return this;
    }

    public Specification<T> build() {
        return spec;
    }
}

