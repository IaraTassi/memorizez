package com.memorizez.memorizez.review.exception;

public class CardNotAvailableForReviewException extends RuntimeException {

    public CardNotAvailableForReviewException(String message) {
        super(message);
    }
}