package com.memorizez.memorizez.review.dto;

public class ReviewCollectionResponse {

    private String id;
    private String name;
    private long availableCardCount;

    public ReviewCollectionResponse(
            String id,
            String name,
            long availableCardCount) {
        this.id = id;
        this.name = name;
        this.availableCardCount = availableCardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getAvailableCardCount() {
        return availableCardCount;
    }
}
