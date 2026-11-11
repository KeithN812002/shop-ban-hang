package com.fpt.bom.shop.repository;

import com.fpt.bom.shop.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findByUsernameOrderByDefaultAddressDescCreatedDateDesc(String username);

    Optional<Address> findByIdAndUsername(UUID id, String username);

    long countByUsername(String username);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Address a SET a.defaultAddress = false WHERE a.username = :username")
    void clearDefault(@Param("username") String username);
}
