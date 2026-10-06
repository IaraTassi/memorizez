package com.memorizez.memorizez.collection.dto;

import java.time.LocalDate;

public class CollectionResponse {

    private String id;
    private String name;
    private LocalDate createdAt;
    private long cardCount;

    public CollectionResponse(String id, String name, LocalDate createdAt, long cardCount) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.cardCount = cardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public long getCardCount() {
        return cardCount;
    }
}
