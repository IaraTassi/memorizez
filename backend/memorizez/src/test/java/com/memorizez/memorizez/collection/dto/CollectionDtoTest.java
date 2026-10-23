package com.memorizez.memorizez.collection.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CollectionDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator =
                Validation.buildDefaultValidatorFactory()
                        .getValidator();
    }

    @Test
    void shouldRejectBlankNameInCreateCollectionRequest() {

        CreateCollectionRequest request =
                new CreateCollectionRequest();

        request.setName("");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectNameLongerThan100CharactersInCreateCollectionRequest() {

        CreateCollectionRequest request =
                new CreateCollectionRequest();

        request.setName("a".repeat(101));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptNameWith100CharactersInCreateCollectionRequest() {

        CreateCollectionRequest request =
                new CreateCollectionRequest();

        request.setName("a".repeat(100));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectBlankNameInUpdateCollectionRequest() {

        UpdateCollectionRequest request =
                new UpdateCollectionRequest();

        request.setName("");

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldRejectNameLongerThan100CharactersInUpdateCollectionRequest() {

        UpdateCollectionRequest request =
                new UpdateCollectionRequest();

        request.setName("a".repeat(101));

        assertFalse(
                validator.validate(request).isEmpty()
        );
    }

    @Test
    void shouldAcceptNameWith100CharactersInUpdateCollectionRequest() {

        UpdateCollectionRequest request =
                new UpdateCollectionRequest();

        request.setName("a".repeat(100));

        assertTrue(
                validator.validate(request).isEmpty()
        );
    }

}
