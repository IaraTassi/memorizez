package com.memorizez.memorizez.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados necessários para cadastrar um novo usuário")
public class RegisterUserRequest {
    @NotBlank
    @Size(max = 100)
    @Schema(description = "Nome do usuário", example = "Maria Silva")
    private String name;

    @NotBlank
    @Email
    @Size(min = 8)
    @Schema(description = "E-mail do usuário", example = "maria@email.com")
    private String email;

    @NotBlank
    @Schema(description = "Senha para acesso à conta", example = "SenhaForte123")
    private String password;

    @NotBlank
    @Schema(description = "Confirmação da senha informada", example = "SenhaForte123")
    private String confirmPassword;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

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

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
}
