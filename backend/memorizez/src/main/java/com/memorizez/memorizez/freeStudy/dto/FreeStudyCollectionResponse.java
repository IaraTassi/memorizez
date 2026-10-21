package com.memorizez.memorizez.freeStudy.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados de uma coleção disponível para estudo livre")
public class FreeStudyCollectionResponse {

    @Schema(description = "Identificador da coleção", example = "col123")
    private String id;
    @Schema(description = "Nome da coleção", example = "Java Fundamentos")
    private String name;
    @Schema(description = "Quantidade total de cartões da coleção", example = "20")
    private long cardCount;

    public FreeStudyCollectionResponse(
            String id,
            String name,
            long cardCount) {

        this.id = id;
        this.name = name;
        this.cardCount = cardCount;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getCardCount() {
        return cardCount;
    }
}