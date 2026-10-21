package com.memorizez.memorizez.history.dto;

import com.memorizez.memorizez.history.HistoryAction;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Registro de uma ação no histórico")
public record HistoryResponse(
        @Schema(description = "Ação realizada", example = "REMEMBERED")
        HistoryAction action,
        @Schema(description = "Data e hora do registro", example = "2026-10-21T14:30:00")
        LocalDateTime createdAt
) {

}
