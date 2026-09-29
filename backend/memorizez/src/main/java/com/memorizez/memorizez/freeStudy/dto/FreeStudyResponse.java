package com.memorizez.memorizez.freeStudy.dto;

public class FreeStudyResponse {

    private String cardId;
    private String collectionId;
    private String front;
    private String back;
    private String notes;

    public FreeStudyResponse(
            String cardId,
            String collectionId,
            String front,
            String back,
            String notes) {

        this.cardId = cardId;
        this.collectionId = collectionId;
        this.front = front;
        this.back = back;
        this.notes = notes;
    }

    public String getCardId() {
        return cardId;
    }

    public String getCollectionId() {
        return collectionId;
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
}