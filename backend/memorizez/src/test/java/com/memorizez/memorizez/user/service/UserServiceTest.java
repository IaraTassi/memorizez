package com.memorizez.memorizez.user.service;

import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.dto.RegisterUserRequest;
import com.memorizez.memorizez.user.exception.EmailAlreadyRegisteredException;
import com.memorizez.memorizez.user.exception.PasswordMismatchException;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    @Test
    void shouldThrowExceptionWhenPasswordsDoNotMatch() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

        UserService userService =  new UserService(userRepository, passwordEncoder);

        RegisterUserRequest request = new RegisterUserRequest();
        request.setName("Test User");
        request.setEmail("test@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("87654321");

        assertThrows(
                PasswordMismatchException.class,
                () -> userService.register(request)
        );
    }

    @Test
    void shoudThrowExceptionWhenEmailAlreadyRegistered() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

        when(userRepository.existsByEmail("test2@memorizez.com")).thenReturn(true);

        UserService userService = new UserService(userRepository, passwordEncoder);

        RegisterUserRequest request = new RegisterUserRequest();

        request.setName("Test User");
        request.setEmail("test2@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        assertThrows(
                EmailAlreadyRegisteredException.class,
                () -> userService.register((request))
        );
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);

        when(userRepository.existsByEmail("test2@memorizez.com")).thenReturn(false);
        when(passwordEncoder.encode("12345678")).thenReturn("hashed-password");

        UserService userService = new UserService(userRepository, passwordEncoder);

        RegisterUserRequest request = new RegisterUserRequest();
        request.setName("Test User");
        request.setEmail("test2@memorizez.com");
        request.setPassword("12345678");
        request.setConfirmPassword("12345678");

        userService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        verify(passwordEncoder).encode("12345678");
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();

        assertEquals("Test User", savedUser.getName());
        assertEquals("test2@memorizez.com", savedUser.getEmail());
        assertEquals("hashed-password", savedUser.getPassword());
    }

    @Test
    void shouldDeleteUserSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        UserService userService =
                new UserService(
                        userRepository,
                        passwordEncoder
                );

        userService.delete(authentication);

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(userRepository)
                .delete(user);

        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInDelete() {

        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        UserService userService =
                new UserService(
                        userRepository,
                        passwordEncoder
                );

        assertThrows(
                UserNotFoundException.class,
                () -> userService.delete(authentication)
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verify(userRepository, never())
                .delete(any(User.class));

        verifyNoInteractions(passwordEncoder);
    }
}
