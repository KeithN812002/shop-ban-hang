package com.fpt.bom.shop.entity;

import com.fpt.bom.shop.enums.ApprovalStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shop_shipper")
public class Shipper extends ShopEntity {

    @Column(name = "username", length = 50, nullable = false, unique = true)
    private String username;

    @Column(name = "full_name", length = 200, nullable = false)
    private String fullName;

    @Column(name = "phone", length = 30, nullable = false)
    private String phone;

    @Column(name = "id_number", length = 30, nullable = false)
    private String idNumber;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "vehicle_plate", length = 30)
    private String vehiclePlate;

    @Column(name = "area_province", length = 100)
    private String areaProvince;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ApprovalStatus status;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;
}
