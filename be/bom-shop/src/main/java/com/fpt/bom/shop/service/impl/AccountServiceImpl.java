package com.fpt.bom.shop.service.impl;

import com.fpt.bom.sa.entity.User;
import com.fpt.bom.sa.repository.UserRepository;
import com.fpt.bom.shop.dto.AccountDto.ProfileResponse;
import com.fpt.bom.shop.dto.AccountDto.RegisterRequest;
import com.fpt.bom.shop.dto.AdminDto.AccountFilter;
import com.fpt.bom.shop.dto.AdminDto.AccountResponse;
import com.fpt.bom.shop.entity.Shipper;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.repository.CartItemRepository;
import com.fpt.bom.shop.repository.NotificationRepository;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.repository.ShipperRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.AccountService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.UserDirectory;
import com.fpt.core.common.constant.Constants;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.enums.StatusBasic;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.keycloak.services.KeycloakService;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final StoreRepository storeRepository;
    private final ShipperRepository shipperRepository;
    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final CartItemRepository cartItemRepository;
    private final AccessSupport accessSupport;
    private final UserDirectory userDirectory;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUserNameIgnoreCase(username)) {
            throw new BaseException("user.userName.existed");
        }
        if (emailTaken(email)) {
            throw new BaseException("shop.register.emailExists");
        }
        if (keycloakService.userExists(username)) {
            throw new BaseException("user.userName.existed");
        }
        Map<String, Object> validation = keycloakService.validatePassword(request.password());
        if (!Boolean.TRUE.equals(validation.get("valid"))) {
            Object errors = validation.get("errors");
            String detail = errors instanceof List<?> list
                    ? list.stream().map(String::valueOf).collect(Collectors.joining("; ")) : "";
            throw new BaseException("shop.register.passwordInvalid", detail);
        }

        User user = new User();
        user.setUserName(username);
        user.setPersonalName(request.fullName().trim());
        user.setEmail(email);
        user.setIsInternal(false);
        user.setAppCode(Constants.APP.CORE_APP);
        user.setRoles(new ArrayList<>());
        user.setStatus(StatusBasic.ACTIVE);

        // Keycloak's user profile requires both names; Vietnamese full names put the family name first.
        String[] nameParts = user.getPersonalName().split("\\s+", 2);
        String lastName = nameParts[0];
        String firstName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
        // createUser sets the password as temporary (admin-created accounts); a self-registered buyer keeps
        // the one they typed, so create without a password and set it as permanent.
        String keycloakUserId = keycloakService.createUser(username, null, email, firstName, lastName, true, "false");
        user.setExtId(UUID.fromString(keycloakUserId));
        try {
            keycloakService.changeUserPassword(username, request.password(), false);
            userRepository.save(user);
            userRepository.flush();
        } catch (RuntimeException e) {
            try {
                keycloakService.deleteUser(username);
            } catch (RuntimeException rollbackError) {
                log.error("Failed to roll back Keycloak user {} after DB failure", username, rollbackError);
            }
            throw e;
        }
        log.info("Shop user registered: username={}", username);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse profile() {
        String username = accessSupport.currentUsername();
        User user = userDirectory.find(username).orElseThrow(() -> new BaseException("auth.user.not.found"));
        Store store = storeRepository.findByOwnerUsernameAndIsDeletedFalse(username).orElse(null);
        Shipper shipper = shipperRepository.findByUsername(username).orElse(null);
        return new ProfileResponse(username, user.getPersonalName(), user.getEmail(), store != null,
                store != null ? store.getId() : null, store != null ? store.getStatus() : null,
                store != null ? store.getRejectReason() : null, shipper != null,
                shipper != null ? shipper.getStatus() : null, shipper != null ? shipper.getRejectReason() : null,
                notificationRepository.countByUsernameAndReadFalse(username),
                cartItemRepository.countByUsername(username));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<AccountResponse> adminSearch(AccountFilter filter) {
        SpecificationBuilder<User> builder = new SpecificationBuilder<>();
        builder.and(eq("isInternal", false));
        builder.and(eq("isDeleted", false));
        builder.and(eq("appCode", Constants.APP.CORE_APP));
        builder.and(eq("status", filter.getStatus()));
        builder.and(keyword(filter.getKeyword()));
        builder.and(roleScope(filter.getRole()));
        Page<User> page = userRepository.findAll(builder.build(),
                Objects.requireNonNull(PageableUtils.pageable(filter)));

        List<String> names = page.getContent().stream().map(User::getUserName).toList();
        Map<String, Store> stores = names.isEmpty() ? Map.of()
                : storeRepository.findByOwnerUsernameInAndIsDeletedFalse(names).stream()
                        .collect(Collectors.toMap(Store::getOwnerUsername, Function.identity()));
        Map<String, Shipper> shippers = names.isEmpty() ? Map.of()
                : shipperRepository.findByUsernameIn(names).stream()
                        .collect(Collectors.toMap(Shipper::getUsername, Function.identity()));
        Map<String, OrderRepository.BuyerTotals> totals = names.isEmpty() ? Map.of()
                : orderRepository.totalsByBuyer(names).stream()
                        .collect(Collectors.toMap(OrderRepository.BuyerTotals::getBuyer, Function.identity()));

        List<AccountResponse> rows = page.getContent().stream().map(u -> {
            Store store = stores.get(u.getUserName());
            Shipper shipper = shippers.get(u.getUserName());
            OrderRepository.BuyerTotals total = totals.get(u.getUserName());
            List<String> roles = new ArrayList<>(List.of("BUYER"));
            if (store != null) {
                roles.add("SELLER");
            }
            if (shipper != null) {
                roles.add("SHIPPER");
            }
            String phone = shipper != null ? shipper.getPhone() : store != null ? store.getPhone() : null;
            return new AccountResponse(u.getId(), u.getUserName(), u.getPersonalName(), u.getEmail(), phone, roles,
                    u.getStatus(), total != null ? total.getOrders() : 0L,
                    total != null ? total.getSpent() : BigDecimal.ZERO, store != null ? store.getId() : null,
                    store != null ? store.getName() : null, store != null ? store.getStatus() : null,
                    shipper != null ? shipper.getId() : null, shipper != null ? shipper.getStatus() : null,
                    u.getCreatedDate());
        }).toList();
        return new PageResult<>(rows, page.getTotalElements(), page.getTotalPages(), page.getNumber() + 1,
                page.getSize());
    }

    private boolean emailTaken(String email) {
        Specification<User> spec = (root, query, cb) -> cb.and(
                cb.equal(cb.lower(root.get("email")), email), cb.equal(root.get("isDeleted"), false));
        return userRepository.count(spec) > 0;
    }

    private Specification<User> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            return cb.or(cb.like(cb.lower(root.get("userName")), pattern, '\\'),
                    cb.like(cb.lower(root.get("personalName")), pattern, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("email"), "")), pattern, '\\'));
        };
    }

    /** BUYER = everyone; SELLER = owns a store; SHIPPER = has a shipper row. */
    private Specification<User> roleScope(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
        return (root, query, cb) -> switch (normalized) {
            case "SELLER" -> {
                Subquery<String> sub = query.subquery(String.class);
                Root<Store> store = sub.from(Store.class);
                sub.select(store.get("ownerUsername")).where(cb.equal(store.get("isDeleted"), false));
                yield root.get("userName").in(sub);
            }
            case "SHIPPER" -> {
                Subquery<String> sub = query.subquery(String.class);
                Root<Shipper> shipper = sub.from(Shipper.class);
                sub.select(shipper.get("username"));
                yield root.get("userName").in(sub);
            }
            default -> cb.conjunction();
        };
    }
}
