package com.memorizez.memorizez.user.service;

import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;

public class CustomUserDetailsServiceTest {

    @Test
    void shouldLoadUserByEmail() {
        UserRepository userRepository = mock(UserRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(java.util.Optional.of(user));

        CustomUserDetailsService service =
                new CustomUserDetailsService(userRepository);

        UserDetails userDetails =
                service.loadUserByUsername("test@memorizez.com");

        assertEquals("test@memorizez.com", userDetails.getUsername());
        assertEquals("hashed-password", userDetails.getPassword());
        verify(userRepository).findByEmail("test@memorizez.com");
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFound() {
        UserRepository userRepository = mock(UserRepository.class);

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CustomUserDetailsService service =
                new CustomUserDetailsService(userRepository);

        assertThrows(
                UsernameNotFoundException.class,
                () -> service.loadUserByUsername("unknown@memorizez.com")

        );
        verify(userRepository).findByEmail("unknown@memorizez.com");
    }

}
