package com.memorizez.memorizez.review.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Coleção disponível para uma sessão de revisão")
public class ReviewCollectionResponse {

    @Schema(description = "Identificador da coleção", example = "col123")
    private String id;
    @Schema(description = "Nome da coleção", example = "Java Fundamentos")
    private String name;
    @Schema(description = "Quantidade de cartões disponíveis para revisão", example = "12")
    private long availableCardCount;

    public ReviewCollectionResponse(
            String id,
            String name,
            long availableCardCount) {
        this.id = id;
        this.name = name;
        this.availableCardCount = availableCardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getAvailableCardCount() {
        return availableCardCount;
    }
}
