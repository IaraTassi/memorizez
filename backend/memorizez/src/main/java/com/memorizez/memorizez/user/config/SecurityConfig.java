package com.memorizez.memorizez.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository securityContextRepository) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .securityContext(securityContext -> securityContext
                        .securityContextRepository(securityContextRepository)
                        .requireExplicitSave(true)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/users", "/users/login").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(
                                new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)
                        )
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(provider);
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}