package com.exo.controller;

import com.exo.dto.JwtAuthenticationResponse;
import com.exo.dto.LoginRequest;
import com.exo.dto.SignUpRequest;
import com.exo.model.User;
import com.exo.service.AuthenticationService;
import com.exo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs for user authentication and registration")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @PostMapping("/signup")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sign up a new user", description = "Creates a new user account. (Admin only)")
    public ResponseEntity<?> signup(@RequestBody SignUpRequest request) {
        try {
            return ResponseEntity.ok(authenticationService.signup(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Log in a user", description = "Authenticates a user and returns JWT tokens.")
    public ResponseEntity<JwtAuthenticationResponse> login(@RequestBody LoginRequest request) {
        logger.info("Login attempt for user: {}", request.getUsername());
        try {
            JwtAuthenticationResponse response = authenticationService.login(request);
            logger.info("Login successful for user: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for user: " + request.getUsername(), e);
            throw e;
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns information about the currently authenticated user")
    public ResponseEntity<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username).orElse(null);
        
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }
}
