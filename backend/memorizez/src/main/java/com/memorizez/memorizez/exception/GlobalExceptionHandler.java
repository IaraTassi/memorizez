package com.memorizez.memorizez.exception;

import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.user.exception.EmailAlreadyRegisteredException;
import com.memorizez.memorizez.user.exception.PasswordMismatchException;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public void handlerEmailAlreadyRegistered() {

    }

    @ExceptionHandler(PasswordMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public void handlePasswordMismatch() {

    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public void handleAuthenticationFailure() {
    }

    @ExceptionHandler(CardNotRevealedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public void handleCardNotRevealed() {

    }

    @ExceptionHandler(CardNotAvailableForReviewException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public void handleCardNotAvailableForReview() {

    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void handleUserNotFound() {
    }

    @ExceptionHandler(CollectionNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void handleCollectionNotFound() {
    }

    @ExceptionHandler(CardNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public void handleCardNotFound() {
    }
}
