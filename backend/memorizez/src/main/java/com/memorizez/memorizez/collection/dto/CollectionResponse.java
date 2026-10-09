package com.memorizez.memorizez.collection.dto;

import java.time.LocalDate;

public class CollectionResponse {

    private String id;
    private String name;
    private LocalDate createdAt;
    private long cardCount;
    private long availableCardCount;

    public CollectionResponse(String id, String name, LocalDate createdAt, long cardCount, long availableCardCount) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.cardCount = cardCount;
        this.availableCardCount = availableCardCount;
    }

    public long getAvailableCardCount() {
        return availableCardCount;
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
