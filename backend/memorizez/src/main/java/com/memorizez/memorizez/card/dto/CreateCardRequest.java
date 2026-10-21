package com.memorizez.memorizez.card.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados necessários para criar um cartão de estudo")
public class CreateCardRequest {

    @NotBlank
    @Size(max = 200)
    @Schema(description = "Conteúdo da frente do cartão", example = "O que é uma classe em Java?")
    private String front;

    @NotBlank
    @Size(max = 400)
    @Schema(description = "Conteúdo do verso do cartão", example = "Uma estrutura que define atributos e comportamentos de objetos.")
    private String back;

    @Size(max = 300)
    @Schema(description = "Observações adicionais (opcional)", example = "Revisar os conceitos de orientação a objetos.")
    private String notes;

    public String getFront() {
        return front;
    }

    public void setFront(String front) {
        this.front = front;
    }

    public String getBack() {
        return back;
    }

    public void setBack(String back) {
        this.back = back;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
