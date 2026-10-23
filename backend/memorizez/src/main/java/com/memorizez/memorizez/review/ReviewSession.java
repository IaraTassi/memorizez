package com.memorizez.memorizez.review;

import java.util.List;

public class ReviewSession {

    private final String collectionId;
    private final List<String> cardIds;
    private int currentIndex;

    public ReviewSession(
            String collectionId,
            List<String> cardIds) {
        this.collectionId = collectionId;
        this.cardIds = List.copyOf(cardIds);
        this.currentIndex = 0;
    }

    public String getCollectionId() {
        return collectionId;
    }

    public List<String> getCardIds() {
        return cardIds;
    }

    public int getCurrentIndex() {
        return currentIndex;
    }

    public int getTotalCards() {
        return cardIds.size();
    }

    public int getCompletedCards() {
        return currentIndex;
    }

    public int getPercentage() {
        if (getTotalCards() == 0) {
            return 0;
        }

        return (int) Math.round(
                getCompletedCards() * 100.0 / getTotalCards()
        );
    }

    public String getCurrentCardId() {
        return cardIds.get(currentIndex);
    }

    public void advance() {
        currentIndex++;
    }
}