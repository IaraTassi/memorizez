package com.memorizez.memorizez.user.controller;


import com.memorizez.memorizez.user.dto.LoginRequest;
import com.memorizez.memorizez.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;


import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class UserControllerTest {

    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final SecurityContextRepository securityContextRepository = mock(SecurityContextRepository.class);
    private final UserService userService = mock(UserService.class);

    private final UserController userController = new UserController(userService, authenticationManager, securityContextRepository);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

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


}
