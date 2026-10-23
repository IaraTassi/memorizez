package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewStage;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Dados do cartão apresentado durante uma revisão")
public class ReviewResponse {

    @Schema(description = "Identificador do cartão", example = "card123")
    private String cardId;
    @Schema(description = "Pergunta ou conteúdo da frente do cartão", example = "O que é uma classe em Java?")
    private String front;
    @Schema(description = "Resposta ou conteúdo do verso do cartão", example = "Uma estrutura que define atributos e comportamentos de objetos.")
    private String back;
    @Schema(description = "Observações adicionais do cartão", example = "Revisar os conceitos de orientação a objetos.")
    private String notes;
    @Schema(description = "Etapa atual do intervalo de revisão", example = "SEVEN_DAYS")
    private ReviewStage stage;
    @Schema(description = "Data prevista para a próxima revisão", example = "2026-10-28")
    private LocalDate nextReviewDate;
    @Schema(description = "Progresso atual da sessão")
    private ReviewProgressResponse progress;

    public ReviewResponse(
            String cardId,
            String front,
            String back,
            String notes,
            ReviewStage stage,
            LocalDate nextReviewDate, ReviewProgressResponse progress) {
        this.cardId = cardId;
        this.front = front;
        this.back = back;
        this.notes = notes;
        this.stage = stage;
        this.nextReviewDate = nextReviewDate;
        this.progress = progress;

    }

    public String getCardId() {
        return cardId;
    }

    public String getFront() {
        return front;
    }

    public String getBack() {
        return back;
    }

    public String getNotes() {
        return notes;
    }

    public ReviewStage getStage() {
        return stage;
    }

    public LocalDate getNextReviewDate() {
        return nextReviewDate;
    }

    public ReviewProgressResponse getProgress() {
        return progress;
    }
}
