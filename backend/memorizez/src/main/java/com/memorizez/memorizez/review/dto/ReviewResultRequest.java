package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewResult;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Resultado informado pelo usuário ao revisar um cartão")
public class ReviewResultRequest {

    @NotNull
    @Schema(description = "Indica se o usuário lembrou ou não a resposta", example = "REMEMBERED", requiredMode = Schema.RequiredMode.REQUIRED)
    private ReviewResult result;

    public ReviewResult getResult() {
        return result;
    }

    public void setResult(ReviewResult result) {
        this.result = result;
    }
}
