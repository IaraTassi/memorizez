package com.memorizez.memorizez.user.service;

import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.dto.RegisterUserRequest;
import com.memorizez.memorizez.user.exception.EmailAlreadyRegisteredException;
import com.memorizez.memorizez.user.exception.PasswordMismatchException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void register(RegisterUserRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyRegisteredException("Email already registered");
        }

        String hashedPassword =passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getName(),
                request.getEmail(),
                hashedPassword
        );

        userRepository.save(user);
    }
}
