package com.fpt.bom.sa.repository;

import com.fpt.bom.sa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    boolean existsByUserNameIgnoreCase(String userName);

    boolean existsByUserNameIgnoreCaseAndIsDeletedFalse(String userName);

    Optional<User> findByIdAndIsDeletedFalse(UUID id);

    List<User> findByIdInAndIsDeletedFalse(List<UUID> ids);

    Optional<User> findByUserNameAndIsDeletedFalse(String userName);

    @Modifying
    @Query(value = """
            UPDATE sa_user
            SET roles = array_remove(roles, CAST(:code AS text)), updated_date = now(), updated_by = :updatedBy
            WHERE CAST(:code AS text) = ANY(roles)
            """, nativeQuery = true)
    void removeRoleCode(@Param("code") String code, @Param("updatedBy") String updatedBy);
}
