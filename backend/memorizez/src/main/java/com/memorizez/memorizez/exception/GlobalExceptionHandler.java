package com.memorizez.memorizez.exception;

import com.memorizez.memorizez.user.exception.EmailAlreadyRegisteredException;
import com.memorizez.memorizez.user.exception.PasswordMismatchException;
import org.springframework.http.HttpStatus;
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
}
