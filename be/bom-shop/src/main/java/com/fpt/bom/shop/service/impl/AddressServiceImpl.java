package com.fpt.bom.shop.service.impl;

import com.fpt.bom.shop.dto.CartDto.AddressRequest;
import com.fpt.bom.shop.dto.CartDto.AddressResponse;
import com.fpt.bom.shop.entity.Address;
import com.fpt.bom.shop.repository.AddressRepository;
import com.fpt.bom.shop.service.AddressService;
import com.fpt.bom.shop.service.support.AccessSupport;
import com.fpt.bom.shop.service.support.ShopMapper;
import com.fpt.bom.shop.service.support.TextSupport;
import com.fpt.core.common.exception.BaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private static final int MAX_ADDRESSES = 20;

    private final AddressRepository addressRepository;
    private final AccessSupport accessSupport;
    private final ShopMapper shopMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> list() {
        return addressRepository.findByUsernameOrderByDefaultAddressDescCreatedDateDesc(
                accessSupport.currentUsername()).stream().map(shopMapper::toAddress).toList();
    }

    @Override
    @Transactional
    public void create(AddressRequest request) {
        String username = accessSupport.currentUsername();
        long existing = addressRepository.countByUsername(username);
        if (existing >= MAX_ADDRESSES) {
            throw new BaseException("shop.address.limitReached");
        }
        Address address = new Address();
        address.setUsername(username);
        apply(address, request);
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault()) || existing == 0;
        if (makeDefault) {
            addressRepository.clearDefault(username);
        }
        address.setDefaultAddress(makeDefault);
        addressRepository.save(address);
        log.info("Address created: user={}, id={}", username, address.getId());
    }

    @Override
    @Transactional
    public void update(AddressRequest request) {
        String username = accessSupport.currentUsername();
        Address address = addressRepository.findByIdAndUsername(Objects.requireNonNull(request.id()), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault());
        if (makeDefault && !address.isDefaultAddress()) {
            addressRepository.clearDefault(username);
            address = addressRepository.findByIdAndUsername(request.id(), username)
                    .orElseThrow(() -> new BaseException("APP_DATA404"));
        }
        apply(address, request);
        address.setDefaultAddress(makeDefault || address.isDefaultAddress());
        addressRepository.save(address);
        log.info("Address updated: user={}, id={}", username, address.getId());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        String username = accessSupport.currentUsername();
        Address address = addressRepository.findByIdAndUsername(Objects.requireNonNull(id), username)
                .orElseThrow(() -> new BaseException("APP_DATA404"));
        addressRepository.delete(address);
        addressRepository.flush();
        if (address.isDefaultAddress()) {
            addressRepository.findByUsernameOrderByDefaultAddressDescCreatedDateDesc(username).stream()
                    .findFirst().ifPresent(next -> {
                        next.setDefaultAddress(true);
                        addressRepository.save(next);
                    });
        }
        log.info("Address deleted: user={}, id={}", username, id);
    }

    private void apply(Address address, AddressRequest request) {
        address.setReceiverName(request.receiverName().trim());
        address.setPhone(request.phone().trim());
        address.setProvince(request.province().trim());
        address.setDistrict(TextSupport.blankToNull(request.district()));
        address.setWard(TextSupport.blankToNull(request.ward()));
        address.setDetail(request.detail().trim());
    }
}
