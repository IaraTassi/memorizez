package com.memorizez.memorizez.review;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Etapa do intervalo de revisão espaçada")
public enum ReviewStage {

    @Schema(description = "Intervalo de 1 dia")
    ONE_DAY(1),
    @Schema(description = "Intervalo de 7 dias")
    SEVEN_DAYS(7),
    @Schema(description = "Intervalo de 15 dias")
    FIFTEEN_DAYS(15),
    @Schema(description = "Intervalo de 30 dias")
    THIRTY_DAYS(30);

    private final int intervalDays;

    ReviewStage(int intervalDays) {
        this.intervalDays = intervalDays;
    }

    public int getIntervalDays() {
        return intervalDays;
    }

    public ReviewStage next() {
        if (this == THIRTY_DAYS) {
            return THIRTY_DAYS;
        }

        return ReviewStage.values()[ordinal() + 1];
    }
}