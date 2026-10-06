package com.memorizez.memorizez.history.dto;

public record HistoryCardResponse(
        String id,
        String front,
        long rememberedCount,
        long notRememberedCount,
        long editCount
) {
}
