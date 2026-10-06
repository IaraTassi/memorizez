package com.memorizez.memorizez.history.dto;

public record HistoryCollectionResponse(
        String id,
        String name,
        long cardCount
) {
}
