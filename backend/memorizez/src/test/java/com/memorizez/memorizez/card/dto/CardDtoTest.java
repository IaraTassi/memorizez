package com.memorizez.memorizez.card.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CardDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator =
                Validation.buildDefaultValidatorFactory()
                        .getValidator();
    }

    @Test
    void shouldRejectBlankFrontInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("");
        request.setBack("Valid back");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectFrontLongerThan200CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("a".repeat(201));
        request.setBack("Valid back");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptFrontWith200CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("a".repeat(200));
        request.setBack("Valid back");

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBlankBackInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("Valid front");
        request.setBack("");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBackLongerThan400CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("Valid front");
        request.setBack("a".repeat(401));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptBackWith400CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("Valid front");
        request.setBack("a".repeat(400));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectNotesLongerThan300CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("Valid front");
        request.setBack("Valid back");
        request.setNotes("a".repeat(301));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptNotesWith300CharactersInCreateCardRequest() {

        CreateCardRequest request =
                new CreateCardRequest();

        request.setFront("Valid front");
        request.setBack("Valid back");
        request.setNotes("a".repeat(300));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBlankFrontInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("");
        request.setBack("Valid back");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectFrontLongerThan200CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("a".repeat(201));
        request.setBack("Valid back");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptFrontWith200CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("a".repeat(200));
        request.setBack("Valid back");

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBlankBackInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("Valid front");
        request.setBack("");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBackLongerThan400CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("Valid front");
        request.setBack("a".repeat(401));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptBackWith400CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("Valid front");
        request.setBack("a".repeat(400));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectNotesLongerThan300CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("Valid front");
        request.setBack("Valid back");
        request.setNotes("a".repeat(301));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptNotesWith300CharactersInUpdateCardRequest() {

        UpdateCardRequest request =
                new UpdateCardRequest();

        request.setFront("Valid front");
        request.setBack("Valid back");
        request.setNotes("a".repeat(300));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }
}
