package com.memorizez.memorizez.history.dto;

import com.memorizez.memorizez.history.HistoryAction;

import java.time.LocalDateTime;

public record HistoryResponse(
        HistoryAction action,
        LocalDateTime createdAt
) {

}
