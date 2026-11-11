package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.constant.ShopConstants;
import com.fpt.bom.shop.dto.CatalogDto.ReviewFilter;
import com.fpt.bom.shop.dto.CatalogDto.ReviewResponse;
import com.fpt.bom.shop.dto.CatalogDto.ReviewSummary;
import com.fpt.bom.shop.dto.OrderDto.ReviewCreateRequest;
import com.fpt.bom.shop.dto.SellerDto.ReviewReplyRequest;
import com.fpt.bom.shop.entity.OrderItem;
import com.fpt.bom.shop.entity.Product;
import com.fpt.bom.shop.entity.Review;
import com.fpt.bom.shop.entity.ShopOrder;
import com.fpt.bom.shop.entity.Store;
import com.fpt.bom.shop.enums.NotificationType;
import com.fpt.bom.shop.enums.OrderStatus;
import com.fpt.bom.shop.repository.OrderItemRepository;
import com.fpt.bom.shop.repository.OrderRepository;
import com.fpt.bom.shop.repository.ProductRepository;
import com.fpt.bom.shop.repository.ReviewRepository;
import com.fpt.bom.shop.repository.StoreRepository;
import com.fpt.bom.shop.service.ReviewService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.NotificationSupport;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.bom.shop.service.support.UserDirectory;
import com.fpt.core.common.dto.PageResult;
import com.fpt.core.common.exception.BaseException;
import com.fpt.core.persistence.spec.SpecificationBuilder;
import com.fpt.core.persistence.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fpt.core.persistence.spec.JpaFieldSpecifications.eq;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.isNotNull;
import static com.fpt.core.persistence.spec.JpaFieldSpecifications.isNull;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final AccessSupport accessSupport;
    private final UserDirectory userDirectory;
    private final NotificationSupport notificationSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResult<ReviewResponse> productReviews(UUID productId, ReviewFilter filter) {
        if (productRepository.findByIdAndIsDeletedFalse(Objects.requireNonNull(productId)).isEmpty()) {
            throw new BaseException("APP_DATA404");
        }
        SpecificationBuilder<Review> builder = new SpecificationBuilder<>();
        builder.and(eq("productId", productId));
        builder.and(eq("rating", filter.getRating()));
        return page(builder, filter, false);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummary summary(UUID productId) {
        Map<Integer, Long> counts = new TreeMap<>();
        for (int star = 1; star <= 5; star++) {
            counts.put(star, 0L);
        }
        reviewRepository.countByRating(Objects.requireNonNull(productId))
                .forEach(row -> counts.put(row.getRating(), row.getTotal()));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        double sum = counts.entrySet().stream().mapToDouble(e -> e.getKey() * (double) e.getValue()).sum();
        double average = total == 0 ? 0 : Math.round(sum / total * 10.0) / 10.0;
        return new ReviewSummary(average, total, counts);
    }

    @Override
    @Transactional
    public void create(ReviewCreateRequest request) {
        String username = accessSupport.currentUsername();
        OrderItem item = orderItemRepository.findById(Objects.requireNonNull(request.orderItemId()))
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        ShopOrder order = orderRepository.findByIdAndBuyerUsername(item.getOrderId(), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BaseException("shop.review.orderNotCompleted");
        }
        if (item.isReviewed() || reviewRepository.existsByOrderItemId(item.getId())) {
            throw new BaseException("shop.review.alreadyReviewed");
        }

        Review review = new Review();
        review.setOrderItemId(item.getId());
        review.setProductId(item.getProductId());
        review.setStoreId(order.getStoreId());
        review.setBuyerUsername(username);
        review.setRating(request.rating());
        review.setComment(TextSupport.blankToNull(request.comment()));
        List<String> images = request.imageUrls() == null ? List.of()
                : TextSupport.fileUrls(request.imageUrls()).stream().limit(ShopConstants.MAX_REVIEW_IMAGES).toList();
        review.setImageUrls(TextSupport.joinCsv(images));
        reviewRepository.save(review);

        item.setReviewed(true);
        orderItemRepository.save(item);
        reviewRepository.flush();

        productRepository.refreshRating(item.getProductId());
        storeRepository.refreshRating(order.getStoreId());
        storeRepository.findById(order.getStoreId()).ifPresent(store -> notificationSupport.send(
                store.getOwnerUsername(), NotificationType.ORDER, "shop.notify.review.created",
                review.getComment(), "/seller/reviews", item.getProductName(), request.rating()));
        log.info("Created review: id={}, orderItem={}, rating={}", review.getId(), item.getId(),
                request.rating());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<ReviewResponse> sellerSearch(ReviewFilter filter) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        SpecificationBuilder<Review> builder = new SpecificationBuilder<>();
        builder.and(eq("storeId", store.getId()));
        builder.and(eq("rating", filter.getRating()));
        if (filter.getReplied() != null) {
            builder.and(filter.getReplied() ? isNotNull("sellerReply") : isNull("sellerReply"));
        }
        return page(builder, filter, true);
    }

    @Override
    @Transactional
    public void reply(ReviewReplyRequest request) {
        Store store = accessSupport.requireActiveStore(accessSupport.currentUsername());
        Review review = reviewRepository.findByIdAndStoreId(Objects.requireNonNull(request.id()), store.getId())
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        review.setSellerReply(request.reply().trim());
        review.setRepliedAt(LocalDateTime.now());
        reviewRepository.save(review);
        notificationSupport.send(review.getBuyerUsername(), NotificationType.ORDER, "shop.notify.review.replied",
                review.getSellerReply(), "/product/" + review.getProductId(), store.getName());
        log.info("Seller replied to review: id={}", review.getId());
    }

    private PageResult<ReviewResponse> page(SpecificationBuilder<Review> builder, ReviewFilter filter,
            boolean sellerView) {
        Pageable pageable = PageableUtils.pageable(filter.getPageNumber() - 1, filter.getPageSize(),
                "createdDate:DESC");
        Page<Review> page = reviewRepository.findAll(builder.build(), Objects.requireNonNull(pageable));
        List<Review> reviews = page.getContent();

        Map<String, String> names = userDirectory.displayNames(
                reviews.stream().map(Review::getBuyerUsername).toList());
        Map<UUID, OrderItem> items = orderItemRepository
                .findAllById(reviews.stream().map(Review::getOrderItemId).toList()).stream()
                .collect(Collectors.toMap(OrderItem::getId, Function.identity()));
        Map<UUID, Product> products = sellerView
                ? productRepository.findAllById(reviews.stream().map(Review::getProductId).distinct().toList())
                        .stream().collect(Collectors.toMap(Product::getId, Function.identity()))
                : new HashMap<>();

        List<ReviewResponse> responses = reviews.stream().map(r -> {
            OrderItem item = items.get(r.getOrderItemId());
            Product product = products.get(r.getProductId());
            return new ReviewResponse(r.getId(), TextSupport.maskName(names.get(r.getBuyerUsername())),
                    r.getRating(), r.getComment(), TextSupport.splitCsv(r.getImageUrls()),
                    item != null ? item.getVariantName() : null, r.getSellerReply(), r.getCreatedDate(),
                    sellerView ? r.getProductId() : null, product != null ? product.getName() : null,
                    r.getRepliedAt());
        }).toList();
        return new PageResult<>(responses, page.getTotalElements(), page.getTotalPages(),
                page.getNumber() + 1, page.getSize());
    }
}
