package com.memorizez.memorizez.history;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tipo de ação registrada no histórico de um cartão")
public enum HistoryAction {

    @Schema(description = "Cartão criado")
    CREATED,
    @Schema(description = "Usuário lembrou a resposta durante a revisão")
    REMEMBERED,
    @Schema(description = "Usuário não lembrou a resposta durante a revisão")
    NOT_REMEMBERED,
    @Schema(description = "Cartão editado")
    EDITED
}
