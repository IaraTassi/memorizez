package com.memorizez.memorizez.review.dto;

public class ReviewResultResponse {

    private boolean completed;
    private ReviewResponse nextCard;
    private ReviewProgressResponse progress;

    public ReviewResultResponse(
            boolean completed,
            ReviewResponse nextCard,
            ReviewProgressResponse progress) {
        this.completed = completed;
        this.nextCard = nextCard;
        this.progress = progress;
    }

    public boolean isCompleted() {
        return completed;
    }

    public ReviewResponse getNextCard() {
        return nextCard;
    }

    public ReviewProgressResponse getProgress() {
        return progress;
    }
}