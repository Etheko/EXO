package com.exo.config;

import com.exo.model.Role;
import com.exo.model.User;
import com.exo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (userRepository.findByUsername("etheko") == null) {
                log.info("Creating default admin user 'etheko'");
                User admin = new User();
                admin.setUsername("etheko");
                admin.setNick("Etheko");
                admin.setEmail("etheko@example.com");
                // IMPORTANT: Use a strong password in production and store it securely
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
                log.info("'etheko' user created successfully.");
            }
        } catch (Exception e) {
            log.error("Could not initialize default user", e);
        }
    }
}
