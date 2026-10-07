package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewStage;

import java.time.LocalDate;

public class ReviewResponse {

    private String cardId;
    private String front;
    private String back;
    private String notes;
    private ReviewStage stage;
    private LocalDate nextReviewDate;
    private ReviewProgressResponse progress;

    public ReviewResponse(
            String cardId,
            String front,
            String back,
            String notes,
            ReviewStage stage,
            LocalDate nextReviewDate, ReviewProgressResponse progress) {
        this.cardId = cardId;
        this.front = front;
        this.back = back;
        this.notes = notes;
        this.stage = stage;
        this.nextReviewDate = nextReviewDate;
        this.progress = progress;

    }

    public String getCardId() {
        return cardId;
    }

    public String getFront() {
        return front;
    }

    public String getBack() {
        return back;
    }

    public String getNotes() {
        return notes;
    }

    public ReviewStage getStage() {
        return stage;
    }

    public LocalDate getNextReviewDate() {
        return nextReviewDate;
    }

    public ReviewProgressResponse getProgress() {
        return progress;
    }
}
