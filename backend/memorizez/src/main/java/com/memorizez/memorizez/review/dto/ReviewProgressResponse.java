package com.memorizez.memorizez.review.dto;

public class ReviewProgressResponse {

    private int completedCards;
    private int totalCards;
    private int percentage;

    public ReviewProgressResponse(
            int completedCards,
            int totalCards,
            int percentage) {
        this.completedCards = completedCards;
        this.totalCards = totalCards;
        this.percentage = percentage;
    }

    public int getCompletedCards() {
        return completedCards;
    }

    public int getTotalCards() {
        return totalCards;
    }

    public int getPercentage() {
        return percentage;
    }
}
