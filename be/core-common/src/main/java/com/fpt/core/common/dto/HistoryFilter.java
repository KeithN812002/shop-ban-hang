package com.fpt.core.common.dto;

import java.time.LocalDateTime;
import java.util.List;

public interface HistoryFilter {

    LocalDateTime getStartTimeFrom();

    LocalDateTime getStartTimeTo();

    LocalDateTime getEndTimeFrom();

    LocalDateTime getEndTimeTo();

    List<?> getAction();

    List<?> getActionSource();
}
