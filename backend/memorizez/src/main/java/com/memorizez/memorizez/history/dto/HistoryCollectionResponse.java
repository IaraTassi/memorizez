package com.memorizez.memorizez.history.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumo de uma coleção no histórico")
public record HistoryCollectionResponse(

        @Schema(description = "Identificador da coleção", example = "col123")
        String id,
        @Schema(description = "Nome da coleção", example = "Java Fundamentos")
        String name,
        @Schema(description = "Quantidade de cartões da coleção", example = "20")
        long cardCount
) {
}
