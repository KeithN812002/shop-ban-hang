package com.fpt.bom.sa.repository;

import com.fpt.bom.sa.entity.Gender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Author: hoanglm21@fpt.com
 * Date: 13/04/2026
 */
@Repository
public interface GenderRepository extends JpaRepository<Gender, UUID>, JpaSpecificationExecutor<Gender> {
    List<Gender> findByExtIdIn(List<UUID> extIds);
}
