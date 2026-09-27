package com.memorizez.memorizez.card.dto;

import java.time.LocalDate;

public class CardResponse {

    private String id;
    private String front;
    private String back;
    private String notes;
    private LocalDate createdAt;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer editCount;

    public CardResponse(String id, String front, String back, String notes, LocalDate createdAt, Integer correctCount, Integer wrongCount, Integer editCount) {
        this.id = id;
        this.front = front;
        this.back = back;
        this.notes = notes;
        this.createdAt = createdAt;
        this.correctCount = correctCount;
        this.wrongCount = wrongCount;
        this.editCount = editCount;
    }

    public String getId() {
        return id;
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

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public Integer getWrongCount() {
        return wrongCount;
    }

    public Integer getEditCount() {
        return editCount;
    }

}
