package com.memorizez.memorizez.review;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resultado da revisão de um cartão")
public enum ReviewResult {
    @Schema(description = "O usuário lembrou a resposta")
    REMEMBERED,
    @Schema(description = "O usuário não lembrou a resposta")
    NOT_REMEMBERED
}