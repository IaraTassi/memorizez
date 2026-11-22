package com.memorizez.memorizez.user.service;

import com.memorizez.memorizez.user.dto.LoginResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final long expiration;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.expiration}") long expiration) {

        this.jwtEncoder = jwtEncoder;
        this.expiration = expiration;
    }

    public LoginResponse generateToken(Authentication authentication) {

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusMillis(expiration);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("memorizez")
                .subject(authentication.getName())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();

        return new LoginResponse(
                token,
                "Bearer",
                expiresAt
        );
    }
}
