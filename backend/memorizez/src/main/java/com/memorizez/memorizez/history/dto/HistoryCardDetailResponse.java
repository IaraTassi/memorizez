package com.memorizez.memorizez.history.dto;

import java.time.LocalDate;

public record HistoryCardDetailResponse(
        String id,
        String front,
        long rememberedCount,
        long notRememberedCount,
        long editCount,
        LocalDate createdAt,
        LocalDate nextReviewDate
) {
}
