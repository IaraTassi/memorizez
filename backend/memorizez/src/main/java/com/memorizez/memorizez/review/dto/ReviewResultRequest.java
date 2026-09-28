package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewResult;
import jakarta.validation.constraints.NotNull;

public class ReviewResultRequest {

    @NotNull
    private ReviewResult result;

    public ReviewResult getResult() {
        return result;
    }

    public void setResult(ReviewResult result) {
        this.result = result;
    }
}
