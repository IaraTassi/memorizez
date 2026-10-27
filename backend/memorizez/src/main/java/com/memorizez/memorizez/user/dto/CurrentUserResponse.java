package com.memorizez.memorizez.user.dto;

public record CurrentUserResponse(
        Long id,
        String name,
        String email
) {
}