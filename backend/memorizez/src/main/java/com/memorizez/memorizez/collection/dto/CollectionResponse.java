package com.memorizez.memorizez.collection.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Dados de uma coleção de cartões de estudo")
public class CollectionResponse {

    @Schema(description = "Identificador único da coleção", example = "col123")
    private String id;
    @Schema(description = "Nome da coleção", example = "Java Fundamentos")
    private String name;
    @Schema(description = "Data de criação da coleção", example = "2026-10-21")
    private LocalDate createdAt;
    @Schema(description = "Quantidade total de cartões da coleção", example = "20")
    private long cardCount;
    @Schema(description = "Quantidade de cartões disponíveis para estudo", example = "15")
    private long availableCardCount;

    public CollectionResponse(String id, String name, LocalDate createdAt, long cardCount, long availableCardCount) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.cardCount = cardCount;
        this.availableCardCount = availableCardCount;
    }

    public long getAvailableCardCount() {
        return availableCardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public long getCardCount() {
        return cardCount;
    }
}
