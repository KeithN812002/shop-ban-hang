package com.fpt.bom.shop.entity;

import com.fpt.core.persistence.entity.EntitySoftDeleteBase;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** UUID primary key + audit + soft-delete columns. Equality is identity-based on the id. */
@Getter
@Setter
@MappedSuperclass
@EqualsAndHashCode(callSuper = false, onlyExplicitlyIncluded = true)
public abstract class ShopSoftDeleteEntity extends EntitySoftDeleteBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    @EqualsAndHashCode.Include
    private UUID id;
}
