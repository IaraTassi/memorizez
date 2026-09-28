package com.memorizez.memorizez.review.controller;

import com.memorizez.memorizez.exception.GlobalExceptionHandler;
import com.memorizez.memorizez.review.ReviewResult;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.dto.ReviewResultResponse;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.service.ReviewService;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ReviewControllerTest {

    @Test
    void shouldFindAvailableReviewsSuccessfully() throws Exception {

        ReviewService reviewService = mock(ReviewService.class);
        Authentication authentication = mock(Authentication.class);

        ReviewResponse review1 = new ReviewResponse(
                "card-1",
                "What is encapsulation?",
                null,
                null,
                ReviewStage.ONE_DAY,
                LocalDate.now()
        );

        ReviewResponse review2 = new ReviewResponse(
                "card-2",
                "What is inheritance?",
                null,
                null,
                ReviewStage.SEVEN_DAYS,
                LocalDate.now()
        );

        when(reviewService.findAvailableForReview(authentication))
                .thenReturn(List.of(review1, review2));

        ReviewController controller =
                new ReviewController(reviewService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/reviews")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].cardId").value("card-1"))
                .andExpect(jsonPath("$[0].front")
                        .value("What is encapsulation?"))
                .andExpect(jsonPath("$[0].back").doesNotExist())
                .andExpect(jsonPath("$[0].notes").doesNotExist());

        verify(reviewService)
                .findAvailableForReview(authentication);
    }

    @Test
    void shouldRevealCardSuccessfully() throws  Exception {

        ReviewService reviewService = mock(ReviewService.class);
        Authentication authentication = mock(Authentication.class);

        ReviewResponse response = new ReviewResponse(
                "card-1",
                "What is encapsulation?",
                "O que é encapsulamento",
                "Princípio da POO.",
                ReviewStage.ONE_DAY,
                LocalDate.now()
        );

        when(reviewService.reveal(
                "collection-1",
                "card-1",
                authentication
        )).thenReturn(response);

        ReviewController controller =
                new ReviewController(reviewService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/reviews/collections/collection-1/cards/card-1/review")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cardId").value("card-1"))
                .andExpect(jsonPath("$.front")
                        .value("What is encapsulation?"))
                .andExpect(jsonPath("$.back")
                        .value("O que é encapsulamento"))
                .andExpect(jsonPath("$.notes")
                        .value("Princípio da POO."));

        verify(reviewService)
                .reveal(
                        "collection-1",
                        "card-1",
                        authentication
                );
    }

    @Test
    void shouldSubmitResultAndReturnNextCardSuccessfully() throws Exception {

        ReviewService reviewService = mock(ReviewService.class);
        Authentication authentication = mock(Authentication.class);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewResponse nextCard = new ReviewResponse(
                "card-2",
                "What is inheritance?",
                null,
                null,
                ReviewStage.ONE_DAY,
                LocalDate.now()
        );

        ReviewResultResponse response =
                new ReviewResultResponse(false, nextCard);

        when(reviewService.submitResult(
                eq("collection-1"),
                eq("card-1"),
                any(ReviewResultRequest.class),
                eq(authentication)
        )).thenReturn(response);

        ReviewController controller =
                new ReviewController(reviewService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        post("/reviews/collections/collection-1/cards/card-1/result")
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                            {
                                "result": "REMEMBERED"
                            }
                            """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false))
                .andExpect(jsonPath("$.nextCard.cardId")
                        .value("card-2"))
                .andExpect(jsonPath("$.nextCard.front")
                        .value("What is inheritance?"))
                .andExpect(jsonPath("$.nextCard.back").doesNotExist())
                .andExpect(jsonPath("$.nextCard.notes").doesNotExist());

        verify(reviewService)
                .submitResult(
                        eq("collection-1"),
                        eq("card-1"),
                        any(ReviewResultRequest.class),
                        eq(authentication)
                );
    }

    @Test
    void shouldReturnBadRequestWhenCardIsNotRevealed() throws Exception {

        ReviewService reviewService = mock(ReviewService.class);
        Authentication authentication = mock(Authentication.class);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        when(reviewService.submitResult(
                eq("collection-1"),
                eq("card-1"),
                any(ReviewResultRequest.class),
                eq(authentication)
        )).thenThrow(
                new CardNotRevealedException(
                        "Card must be revealed before submitting result"
                )
        );

        ReviewController controller =
                new ReviewController(reviewService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockMvc.perform(
                        post("/reviews/collections/collection-1/cards/card-1/result")
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                        {
                            "result": "REMEMBERED"
                        }
                        """)
                )
                .andExpect(status().isBadRequest());

        verify(reviewService)
                .submitResult(
                        eq("collection-1"),
                        eq("card-1"),
                        any(ReviewResultRequest.class),
                        eq(authentication)
                );
    }
}
