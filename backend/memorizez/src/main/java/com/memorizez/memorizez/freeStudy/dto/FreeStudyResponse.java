package com.memorizez.memorizez.freeStudy.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados de um cartão para estudo livre")
public class FreeStudyResponse {

    @Schema(description = "Identificador do cartão", example = "card123")
    private String cardId;
    @Schema(description = "Identificador da coleção do cartão", example = "col123")
    private String collectionId;
    @Schema(description = "Conteúdo da frente do cartão", example = "O que é uma classe em Java?")
    private String front;
    @Schema(description = "Conteúdo do verso do cartão", example = "Uma estrutura que define atributos e comportamentos de objetos.")
    private String back;
    @Schema(description = "Observações adicionais do cartão", example = "Revisar os conceitos de orientação a objetos.")
    private String notes;

    public FreeStudyResponse(
            String cardId,
            String collectionId,
            String front,
            String back,
            String notes) {

        this.cardId = cardId;
        this.collectionId = collectionId;
        this.front = front;
        this.back = back;
        this.notes = notes;
    }

    public String getCardId() {
        return cardId;
    }

    public String getCollectionId() {
        return collectionId;
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
}