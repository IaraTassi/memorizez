package com.memorizez.memorizez.review.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Progresso da sessão de revisão")
public class ReviewProgressResponse {

    @Schema(description = "Quantidade de cartões já revisados", example = "5")
    private int completedCards;
    @Schema(description = "Quantidade total de cartões na sessão", example = "20")
    private int totalCards;
    @Schema(description = "Percentual de conclusão da sessão", example = "25")
    private int percentage;

    public ReviewProgressResponse(
            int completedCards,
            int totalCards,
            int percentage) {
        this.completedCards = completedCards;
        this.totalCards = totalCards;
        this.percentage = percentage;
    }

    public int getCompletedCards() {
        return completedCards;
    }

    public int getTotalCards() {
        return totalCards;
    }

    public int getPercentage() {
        return percentage;
    }
}
