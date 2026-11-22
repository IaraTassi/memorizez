package com.memorizez.memorizez.user.service;

import com.memorizez.memorizez.user.dto.LoginResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Test
    void shouldGenerateAndDecodeValidJwtToken() {

        Authentication authentication =
                UsernamePasswordAuthenticationToken.authenticated(
                        "test@memorizez.com",
                        null,
                        java.util.List.of()
                );

        LoginResponse response =
                jwtService.generateToken(authentication);

        Jwt decodedToken = jwtDecoder.decode(response.token());

        assertNotNull(response.token());
        assertFalse(response.token().isBlank());
        assertEquals("Bearer", response.tokenType());

        assertEquals(
                "test@memorizez.com",
                decodedToken.getSubject()
        );

        assertEquals(
                "memorizez",
                decodedToken.getClaimAsString("iss")
        );

        assertEquals(
                response.expiresAt().getEpochSecond(),
                decodedToken.getExpiresAt().getEpochSecond()
        );

        assertTrue(response.expiresAt().isAfter(java.time.Instant.now()));
    }
}
