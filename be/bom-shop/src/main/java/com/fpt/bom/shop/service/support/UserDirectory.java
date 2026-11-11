package com.fpt.bom.shop.service.support;

import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.in;

/** Read-only lookup of core {@code sa_user} rows by Keycloak username. */
@Component
@RequiredArgsConstructor
public class UserDirectory {

    private final UserRepository userRepository;

    public Optional<User> find(String username) {
        return userRepository.findByUserNameAndIsDeletedFalse(username);
    }

    public String displayName(String username) {
        return find(username).map(User::getPersonalName).orElse(username);
    }

    /** username -> personal name (missing users map to their username). */
    public Map<String, String> displayNames(Collection<String> usernames) {
        List<String> names = usernames.stream().filter(Objects::nonNull).distinct().toList();
        Map<String, String> result = new HashMap<>();
        if (names.isEmpty()) {
            return result;
        }
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();
        builder.and(in("userName", names));
        builder.and(eq("isDeleted", false));
        userRepository.findAll(builder.build())
                .forEach(user -> result.put(user.getUserName(), user.getPersonalName()));
        names.forEach(name -> result.putIfAbsent(name, name));
        return result;
    }
}
