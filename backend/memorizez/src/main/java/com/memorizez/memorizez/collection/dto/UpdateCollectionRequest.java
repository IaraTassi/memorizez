package com.memorizez.memorizez.collection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para atualizar uma coleção existente")
public class UpdateCollectionRequest {

    @NotBlank
    @Size(max = 100)
    @Schema(description = "Novo nome da coleção", example = "Java Advançado")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
