package com.memorizez.memorizez.review.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resultado do processamento de uma revisão")
public class ReviewResultResponse {

    @Schema(description = "Indica se a sessão de revisão foi concluída", example = "false")
    private boolean completed;
    @Schema(description = "Próximo cartão a ser revisado")
    private ReviewResponse nextCard;
    @Schema(description = "Progresso atual da sessão de revisão")
    private ReviewProgressResponse progress;

    public ReviewResultResponse(
            boolean completed,
            ReviewResponse nextCard,
            ReviewProgressResponse progress) {
        this.completed = completed;
        this.nextCard = nextCard;
        this.progress = progress;
    }

    public boolean isCompleted() {
        return completed;
    }

    public ReviewResponse getNextCard() {
        return nextCard;
    }

    public ReviewProgressResponse getProgress() {
        return progress;
    }
}