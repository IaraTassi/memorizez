package com.memorizez.memorizez.history.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Detalhes do cartão e de seu histórico de revisão")
public record HistoryCardDetailResponse(
        @Schema(description = "Identificador do cartão", example = "card123")
        String id,
        @Schema(description = "Frente do cartão", example = "O que é uma classe em Java?")
        String front,
        @Schema(description = "Quantidade de respostas lembradas", example = "5")
        long rememberedCount,
        @Schema(description = "Quantidade de respostas não lembradas", example = "2")
        long notRememberedCount,
        @Schema(description = "Quantidade de edições", example = "1")
        long editCount,
        @Schema(description = "Data de criação do cartão", example = "2026-10-01")
        LocalDate createdAt,
        @Schema(description = "Data prevista para a próxima revisão", example = "2026-10-28")
        LocalDate nextReviewDate
) {
}
