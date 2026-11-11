package com.fpt.bom.sa.repository;

import java.util.UUID;

import com.fpt.bom.sa.entity.Role;
import com.fpt.core.common.enums.StatusBasic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 1/1/26
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, UUID>, JpaSpecificationExecutor<Role> {

    @Query(value = "SELECT nextval('sa_role_seq')", nativeQuery = true)
    Long getNextSequenceId();

    List<Role> findByCodeIn(List<String> codes);

    List<Role> findByCodeInAndStatus(List<String> codes, StatusBasic status);
 
    boolean existsByNameIgnoreCase(String name);
 
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}

