package com.fpt.core.common.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {

    private List<T> items;

    private long totalElements;

    private int totalPages;

    private int pageNumber;

    private int pageSize;
}

