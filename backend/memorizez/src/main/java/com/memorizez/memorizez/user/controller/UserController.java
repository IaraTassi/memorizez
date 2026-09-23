package com.memorizez.memorizez.user.controller;

import com.memorizez.memorizez.user.dto.RegisterUserRequest;
import com.memorizez.memorizez.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Void> register(
            @Valid @RequestBody RegisterUserRequest request
            ) {
        userService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
