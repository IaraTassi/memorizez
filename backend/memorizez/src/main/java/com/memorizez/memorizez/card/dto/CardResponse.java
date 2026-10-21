package com.memorizez.memorizez.card.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Dados de um cartão de estudo")
public class CardResponse {

    @Schema(description = "Identificador único do cartão", example = "card123")
    private String id;
    @Schema(description = "Conteúdo apresentado na frente do cartão", example = "O que é uma classe em Java?")
    private String front;
    @Schema(description = "Resposta apresentada no verso do cartão", example = "Uma estrutura que define atributos e comportamentos de objetos.")
    private String back;
    @Schema(description = "Observações adicionais do cartão", example = "Revisar os conceitos de orientação a objetos.")
    private String notes;
    @Schema(description = "Data de criação do cartão", example = "2026-10-21")
    private LocalDate createdAt;
    @Schema(description = "Quantidade de vezes que o cartão foi lembrado", example = "5")
    private Integer rememberedCount;
    @Schema(description = "Quantidade de vezes que o cartão não foi lembrado", example = "2")
    private Integer notRememberedCount;
    @Schema(description = "Quantidade de vezes que o cartão foi editado", example = "1")
    private Integer editCount;

    public CardResponse(
            String id,
            String front,
            String back,
            String notes,
            LocalDate createdAt,
            Integer rememberedCount,
            Integer notRememberedCount,
            Integer editCount) {

        this.id = id;
        this.front = front;
        this.back = back;
        this.notes = notes;
        this.createdAt = createdAt;
        this.rememberedCount = rememberedCount;
        this.notRememberedCount = notRememberedCount;
        this.editCount = editCount;
    }

    public String getId() {
        return id;
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

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public Integer getRememberedCount() {
        return rememberedCount;
    }

    public Integer getNotRememberedCount() {
        return notRememberedCount;
    }

    public Integer getEditCount() {
        return editCount;
    }

}
