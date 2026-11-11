package com.fpt.bom.shop.service;

import com.fpt.bom.shop.dto.CartDto.AddressRequest;
import com.fpt.bom.shop.dto.CartDto.AddressResponse;

import java.util.List;
import java.util.UUID;

public interface AddressService {

    List<AddressResponse> list();

    void create(AddressRequest request);

    void update(AddressRequest request);

    void delete(UUID id);
}
