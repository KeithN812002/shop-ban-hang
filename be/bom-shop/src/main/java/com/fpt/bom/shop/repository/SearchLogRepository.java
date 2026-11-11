package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, UUID> {

    @Query(value = """
            SELECT keyword FROM shop_search_log
            WHERE created_date >= :since
            GROUP BY keyword
            ORDER BY COUNT(*) DESC, MAX(created_date) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<String> findTrendingKeywords(@Param("since") LocalDateTime since, @Param("limit") int limit);
}
