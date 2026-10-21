package com.memorizez.memorizez.card.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para atualizar um cartão de estudo existente")
public class UpdateCardRequest {

    @NotBlank
    @Size(max = 200)
    @Schema(description = "Novo conteúdo da frente do cartão", example = "Qual é a função de uma classe em Java?")
    private String front;

    @NotBlank
    @Size(max = 400)
    @Schema(description = "Novo conteúdo do verso do cartão", example = "Definir a estrutura e os comportamentos de objetos.")
    private String back;

    @Size(max = 300)
    @Schema(description = "Novas observações adicionais (opcional)", example = "")
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
