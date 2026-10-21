package com.memorizez.memorizez.collection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados necessários para criar uma coleção")
public class CreateCollectionRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Nome da nova coleção", example = "Java Fundamentos")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}