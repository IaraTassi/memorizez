package com.memorizez.memorizez.review.dto;

public class ReviewResultResponse {

    private boolean completed;
    private ReviewResponse nextCard;

    public ReviewResultResponse(
            boolean completed,
            ReviewResponse nextCard) {
        this.completed = completed;
        this.nextCard = nextCard;
    }

    public boolean isCompleted() {
        return completed;
    }

    public ReviewResponse getNextCard() {
        return nextCard;
    }
}