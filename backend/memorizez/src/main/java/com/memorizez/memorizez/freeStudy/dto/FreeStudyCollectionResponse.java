package com.memorizez.memorizez.freeStudy.dto;

public class FreeStudyCollectionResponse {

    private String id;
    private String name;
    private long cardCount;

    public FreeStudyCollectionResponse(
            String id,
            String name,
            long cardCount) {

        this.id = id;
        this.name = name;
        this.cardCount = cardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getCardCount() {
        return cardCount;
    }
}