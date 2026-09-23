package com.memorizez.memorizez.user.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RegisterUserRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void shouldRejectBlankName() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("");
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());

    }

    @Test
    void shouldRejectNameLongerThan100Characters() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("a".repeat(101));
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void shouldAcceptNameWith100Characters() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("a".repeat(100));
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void shouldRejectBlankEmail() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void shouldRejectInvalidEmail() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("teste.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void shouldRejectEmailShorterThan8Characters() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("t@m.co");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void shouldAcceptEmailWith8Characters() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void shouldRejectBlankPassword() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("test@memorizez.com");
        request.setPassword("");
        request.setConfirmPassword("12345678");

        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void shouldRejectBlankConfirmPassword() {
        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("test@memorizez.com");
        request.setPassword("1234678");
        request.setConfirmPassword("");

        assertFalse(validator.validate(request).isEmpty());
    }
}

