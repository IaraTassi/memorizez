package com.memorizez.memorizez.card.dto;

import java.time.LocalDate;

public class CardResponse {

    private String id;
    private String front;
    private String back;
    private String notes;
    private LocalDate createdAt;
    private Integer rememberedCount;
    private Integer notRememberedCount;
    private Integer editCount;

    public CardResponse(
            String id,
            String front,
            String back,
            String notes,
            LocalDate createdAt,
            Integer rememberedCount,
            Integer notRememberedCount,
            Integer editCount) {

        this.id = id;
        this.front = front;
        this.back = back;
        this.notes = notes;
        this.createdAt = createdAt;
        this.rememberedCount = rememberedCount;
        this.notRememberedCount = notRememberedCount;
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

    public Integer getRememberedCount() {
        return rememberedCount;
    }

    public Integer getNotRememberedCount() {
        return notRememberedCount;
    }

    public Integer getEditCount() {
        return editCount;
    }

}
