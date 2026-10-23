package com.memorizez.memorizez.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Dados necessários para autenticar um usuário")
public class LoginRequest {

    @NotBlank
    @Email
    @Schema(description = "E-mail cadastrado do usuário", example = "maria@email.com")
    private String email;

    @NotBlank
    @Schema(description = "Senha da conta", example = "SenhaForte123")
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}