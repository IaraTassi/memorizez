package com.memorizez.memorizez.user.controller;


import com.memorizez.memorizez.exception.GlobalExceptionHandler;
import com.memorizez.memorizez.user.dto.LoginRequest;
import com.memorizez.memorizez.user.dto.RegisterUserRequest;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;


import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class UserControllerTest {

    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final SecurityContextRepository securityContextRepository = mock(SecurityContextRepository.class);
    private final UserService userService = mock(UserService.class);

    private final UserController userController = new UserController(userService, authenticationManager, securityContextRepository);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(userController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void shouldRegisterSuccessfully() throws Exception {

        RegisterUserRequest request = new RegisterUserRequest();
        request.setName("Test User");
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        mockMvc.perform(
                        post("/users")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isCreated());

        verify(userService)
                .register(any(RegisterUserRequest.class));

        verifyNoInteractions(
                authenticationManager,
                securityContextRepository
        );
    }

    @Test
    void shouldReturnBadRequestWhenRegistrationRequestIsInvalid() throws Exception {

        RegisterUserRequest request = new RegisterUserRequest();
        request.setName("");
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        mockMvc.perform(
                        post("/users")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isBadRequest());

        verifyNoInteractions(
                userService,
                authenticationManager,
                securityContextRepository
        );
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");

        Authentication authentication = mock(Authentication.class);

        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);

        mockMvc.perform(post("/users/login")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(authenticationManager).authenticate(any());
        verify(securityContextRepository).saveContext(
                any(),any(),any()
        );

    }

    @Test
    void shouldReturnUnauthorizedWhenLoginCredentialsAreInvalid() throws Exception {

        LoginRequest request = new LoginRequest();
        request.setEmail("test@memorizez.com");
        request.setPassword("wrong-password");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(
                        post("/users/login")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isUnauthorized());

        verify(authenticationManager)
                .authenticate(any());

        verifyNoInteractions(
                userService,
                securityContextRepository
        );
    }


    @Test
    void shouldDeleteUserSuccessfully() throws Exception {

        Authentication authentication = mock(Authentication.class);

        mockMvc.perform(
                        delete("/users")
                                .principal(authentication)
                )
                .andExpect(status().isNoContent());

        verify(userService)
                .delete(authentication);

        verifyNoInteractions(
                authenticationManager,
                securityContextRepository
        );
    }

    @Test
    void shouldReturnNotFoundWhenUserIsNotFoundInDelete() throws Exception {

        Authentication authentication = mock(Authentication.class);

        doThrow(new UserNotFoundException("User not found"))
                .when(userService)
                .delete(authentication);

        mockMvc.perform(
                        delete("/users")
                                .principal(authentication)
                )
                .andExpect(status().isNotFound());

        verify(userService)
                .delete(authentication);

        verifyNoInteractions(
                authenticationManager,
                securityContextRepository
        );
    }
}
