package com.memorizez.memorizez.user.controller;

import com.memorizez.memorizez.user.dto.LoginRequest;
import com.memorizez.memorizez.user.dto.RegisterUserRequest;
import com.memorizez.memorizez.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints para gerenciamento de usuários, incluindo criação de contas, autenticação e exclusão de contas existentes.")
public class UserController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public UserController(UserService userService, AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping
    @Operation(summary = "Cadastrar usuário", description = "Cria uma nova conta de usuário.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuário cadastrado com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou confirmação de senha diferente."),
            @ApiResponse(responseCode = "409", description = "Já existe um usuário cadastrado com esse e-mail.")
    })
    public ResponseEntity<Void> register(
            @Valid @RequestBody RegisterUserRequest request
    ) {
        userService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    @Operation(summary = "Realizar login", description = "Autentica um usuário e inicia sua sessão.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados de login inválidos."),
            @ApiResponse(responseCode = "401", description = "E-mail ou senha incorretos.")
    })
    public ResponseEntity<Void> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Authentication authentication =
                authenticationManager.authenticate(
                        UsernamePasswordAuthenticationToken.unauthenticated(
                                request.getEmail(),
                                request.getPassword()
                        )
                );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(
                context,
                httpRequest,
                httpResponse
        );

        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    @Operation(summary = "Excluir conta do usuário", description = "Exclui a conta do usuário autenticado e encerra sua sessão.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Conta excluída com sucesso."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado.")
    })
    public ResponseEntity<Void> delete(
            Authentication authentication,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        userService.delete(authentication);

        SecurityContextLogoutHandler logoutHandler =
                new SecurityContextLogoutHandler();

        logoutHandler.logout(
                httpRequest,
                httpResponse,
                authentication
        );

        return ResponseEntity.noContent().build();
    }

}