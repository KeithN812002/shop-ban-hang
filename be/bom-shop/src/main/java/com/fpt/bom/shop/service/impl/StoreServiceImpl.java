package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.AccountDto.FollowRequest;
import com.fpt.bom.shop.dto.AccountDto.FollowResponse;
import com.fpt.bom.shop.dto.AccountDto.StoreRegisterRequest;
import com.fpt.bom.shop.dto.AdminDto.AdminStoreResponse;
import com.fpt.bom.shop.dto.AdminDto.ApprovalFilter;
import com.fpt.bom.shop.dto.CatalogDto.StoreResponse;
import com.fpt.bom.shop.dto.CommonDto.ReasonRequest;
import com.fpt.bom.shop.dto.SellerDto.StoreUpdateRequest;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.entity.StoreFollow;
import com.fpt.bom.shop.enums.ApprovalStatus;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.repository.StoreFollowRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.StoreService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.NotificationSupport;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.common.util.TextUtils;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private static final String SELLER_LINK = "/seller";

    private final StoreRepository storeRepository;
    private final StoreFollowRepository storeFollowRepository;
    private final AccessSupport accessSupport;
    private final NotificationSupport notificationSupport;
    private final ShopMapper shopMapper;

    @Override
    @Transactional(readOnly = true)
    public StoreResponse publicStore(UUID id) {
        Store store = storeRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(id))
                .filter(s -> s.getStatus() == ApprovalStatus.ACTIVE)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        return shopMapper.toStore(store);
    }

    @Override
    @Transactional
    public void register(StoreRegisterRequest request) {
        String username = accessSupport.currentUsername();
        Optional<Store> existing = storeRepository.findByOwnerUsernameAndIsDeletedFalse(username);
        Store store;
        if (existing.isPresent()) {
            store = existing.get();
            if (store.getStatus() != ApprovalStatus.REJECTED) {
                throw new BaseException("shop.store.alreadyRegistered");
            }
        } else {
            if (storeRepository.existsByOwnerUsername(username)) {
                throw new BaseException("shop.store.alreadyRegistered");
            }
            store = new Store();
            store.setOwnerUsername(username);
            store.setSlug(TextSupport.slugWithSuffix(request.name(), 60));
        }
        store.setName(request.name().trim());
        store.setDescription(TextSupport.blankToNull(request.description()));
        store.setPhone(request.phone().trim());
        store.setAddress(request.address().trim());
        store.setProvince(request.province().trim());
        store.setLogoUrl(TextSupport.fileUrl(request.logoUrl()));
        store.setStatus(ApprovalStatus.PENDING);
        store.setRejectReason(null);
        storeRepository.save(store);
        log.info("Store registration submitted: id={}, owner={}", store.getId(), username);
    }

    @Override
    @Transactional
    public FollowResponse toggleFollow(FollowRequest request) {
        String username = accessSupport.currentUsername();
        Store store = storeRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(request.storeId()))
                .filter(s -> s.getStatus() == ApprovalStatus.ACTIVE)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        Optional<StoreFollow> existing = storeFollowRepository.findByStoreIdAndUsername(store.getId(), username);
        boolean followed;
        if (existing.isPresent()) {
            storeFollowRepository.delete(existing.get());
            followed = false;
        } else {
            StoreFollow follow = new StoreFollow();
            follow.setStoreId(store.getId());
            follow.setUsername(username);
            storeFollowRepository.save(follow);
            followed = true;
        }
        storeFollowRepository.flush();
        storeRepository.refreshFollowerCount(store.getId());
        log.info("Store follow toggled: store={}, user={}, followed={}", store.getId(), username, followed);
        return new FollowResponse(followed);
    }

    @Override
    @Transactional(readOnly = true)
    public FollowResponse followStatus(UUID storeId) {
        return new FollowResponse(storeFollowRepository
                .findByStoreIdAndUsername(Objects.requireNonNull(storeId), accessSupport.currentUsername())
                .isPresent());
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<StoreResponse> followedStores() {
        java.util.List<StoreFollow> follows = storeFollowRepository
                .findByUsernameOrderByCreatedDateDesc(accessSupport.currentUsername());
        java.util.Map<UUID, Store> stores = storeRepository
                .findByIdInAndIsDeletedFalse(follows.stream().map(StoreFollow::getStoreId).toList()).stream()
                .collect(java.util.stream.Collectors.toMap(Store::getId, java.util.function.Function.identity()));
        return follows.stream().map(f -> stores.get(f.getStoreId()))
                .filter(s -> s != null && s.getStatus() == ApprovalStatus.ACTIVE).map(shopMapper::toStore).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStoreResponse sellerStore() {
        return toAdmin(accessSupport.requireOwnStore(accessSupport.currentUsername()));
    }

    @Override
    @Transactional
    public void sellerUpdate(StoreUpdateRequest request) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        store.setName(request.name().trim());
        store.setDescription(TextSupport.blankToNull(request.description()));
        store.setLogoUrl(TextSupport.fileUrl(request.logoUrl()));
        store.setBannerUrl(TextSupport.fileUrl(request.bannerUrl()));
        store.setPhone(request.phone().trim());
        store.setAddress(request.address().trim());
        store.setProvince(request.province().trim());
        storeRepository.save(store);
        log.info("Store updated by owner: id={}", store.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<AdminStoreResponse> adminSearch(ApprovalFilter filter) {
        SpecificationBuilder<Store> builder = new SpecificationBuilder<>();
        builder.and(eq("isDeleted", false));
        builder.and(eq("status", filter.getStatus()));
        builder.and(keyword(filter.getKeyword()));
        Pageable pageable = PageableUtils.pageable(filter);
        Page<Store> page = storeRepository.findAll(builder.build(), pageable);
        return PageableUtils.toPageResult(page, this::toAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStoreResponse adminView(UUID id) {
        return toAdmin(requireStore(id));
    }

    @Override
    @Transactional
    public void approve(ReasonRequest request) {
        Store store = requireStore(request.id());
        requireStatus(store, Set.of(ApprovalStatus.PENDING, ApprovalStatus.REJECTED));
        store.setStatus(ApprovalStatus.ACTIVE);
        store.setRejectReason(null);
        storeRepository.save(store);
        storeRepository.flush();
        storeRepository.refreshProductCount(store.getId());
        notificationSupport.send(store.getOwnerUsername(), NotificationType.SYSTEM, "shop.notify.store.approved",
                null, SELLER_LINK, store.getName());
        log.info("Store approved: id={}", store.getId());
    }

    @Override
    @Transactional
    public void reject(ReasonRequest request) {
        Store store = requireStore(request.id());
        requireStatus(store, Set.of(ApprovalStatus.PENDING));
        store.setStatus(ApprovalStatus.REJECTED);
        store.setRejectReason(TextSupport.blankToNull(request.reason()));
        storeRepository.save(store);
        notificationSupport.send(store.getOwnerUsername(), NotificationType.SYSTEM, "shop.notify.store.rejected",
                store.getRejectReason(), SELLER_LINK, store.getName());
        log.info("Store rejected: id={}", store.getId());
    }

    @Override
    @Transactional
    public void suspend(ReasonRequest request) {
        Store store = requireStore(request.id());
        requireStatus(store, Set.of(ApprovalStatus.ACTIVE));
        store.setStatus(ApprovalStatus.SUSPENDED);
        store.setRejectReason(TextSupport.blankToNull(request.reason()));
        storeRepository.save(store);
        notificationSupport.send(store.getOwnerUsername(), NotificationType.SYSTEM, "shop.notify.store.suspended",
                store.getRejectReason(), SELLER_LINK, store.getName());
        log.info("Store suspended: id={}", store.getId());
    }

    @Override
    @Transactional
    public void reactivate(ReasonRequest request) {
        Store store = requireStore(request.id());
        requireStatus(store, Set.of(ApprovalStatus.SUSPENDED));
        store.setStatus(ApprovalStatus.ACTIVE);
        store.setRejectReason(null);
        storeRepository.save(store);
        notificationSupport.send(store.getOwnerUsername(), NotificationType.SYSTEM,
                "shop.notify.store.reactivated", null, SELLER_LINK, store.getName());
        log.info("Store reactivated: id={}", store.getId());
    }

    private Store requireStore(UUID id) {
        return storeRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(id))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
    }

    private void requireStatus(Store store, Set<ApprovalStatus> allowed) {
        if (!allowed.contains(store.getStatus())) {
            throw new BaseException("shop.store.invalidTransition");
        }
    }

    private Specification<Store> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + TextUtils.escapeSqlLike(keyword.trim().toLowerCase()) + "%";
            return cb.or(cb.like(cb.lower(root.get("name")), pattern, '\\'),
                    cb.like(cb.lower(root.get("ownerUsername")), pattern, '\\'));
        };
    }

    private AdminStoreResponse toAdmin(Store s) {
        return new AdminStoreResponse(s.getId(), s.getOwnerUsername(), s.getName(), s.getSlug(),
                s.getDescription(), s.getLogoUrl(), s.getBannerUrl(), s.getPhone(), s.getAddress(),
                s.getProvince(), s.getStatus(), s.getRejectReason(), s.getRatingAvg(), s.getRatingCount(),
                s.getProductCount(), s.getFollowerCount(), s.getCreatedDate());
    }
}
