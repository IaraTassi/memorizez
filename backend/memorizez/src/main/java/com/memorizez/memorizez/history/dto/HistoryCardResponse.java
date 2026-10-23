package com.memorizez.memorizez.history.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumo do histórico de um cartão")
public record HistoryCardResponse(
        @Schema(description = "Identificador do cartão", example = "card123")
        String id,
        @Schema(description = "Frente do cartão", example = "O que é uma classe em Java?")
        String front,
        @Schema(description = "Quantidade de vezes que a resposta foi lembrada", example = "5")
        long rememberedCount,
        @Schema(description = "Quantidade de vezes que a resposta não foi lembrada", example = "2")
        long notRememberedCount,
        @Schema(description = "Quantidade de edições do cartão", example = "1")
        long editCount
) {
}
