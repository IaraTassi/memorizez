package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewResult;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ReviewDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator =
                Validation.buildDefaultValidatorFactory()
                        .getValidator();
    }

    @Test
    void shouldRejectNullResult() {

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(null);

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptRememberedResult() {

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.REMEMBERED);

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptNotRememberedResult() {

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.NOT_REMEMBERED);

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }


}
