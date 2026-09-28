package com.memorizez.memorizez.review.controller;

import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.dto.ReviewResultResponse;
import com.memorizez.memorizez.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> findAvailableForReview(
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.findAvailableForReview(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}/cards/{cardId}/review")
    public ResponseEntity<ReviewResponse> reveal(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );
    }

    @PostMapping("/collections/{collectionId}/cards/{cardId}/result")
    public ResponseEntity<ReviewResultResponse> submitResult(
            @PathVariable("collectionId") String collectionId,
            @PathVariable("cardId") String cardId,
            @Valid @RequestBody ReviewResultRequest request,
            Authentication authentication) {

        ReviewResultResponse response =
                reviewService.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        return ResponseEntity.ok(response);
    }
}