package com.exo.controller;

import com.exo.dto.JwtAuthenticationResponse;
import com.exo.dto.LoginRequest;
import com.exo.dto.SignUpRequest;
import com.exo.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/signup")
    @Operation(summary = "Sign up a new user", description = "Creates a new user account.")
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
        return ResponseEntity.ok(authenticationService.login(request));
    }
}
