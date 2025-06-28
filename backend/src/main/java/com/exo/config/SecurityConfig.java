package com.exo.config;

import com.exo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserService userService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(withDefaults())
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - accessible to everyone
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/api/sections/**").permitAll()
                .requestMatchers("/assets/**", "/static/**").permitAll()
                
                // Auth endpoints that require authentication
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/logout").authenticated()
                .requestMatchers("/api/auth/**").hasRole("ADMIN")
                
                // Projects - public read, admin write
                .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasRole("ADMIN")
                
                // Users - public read, admin write
                .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                
                // Other entities - public read, admin write
                .requestMatchers(HttpMethod.GET, "/api/certificates/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/certificates/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/certificates/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/certificates/**").hasRole("ADMIN")
                
                .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/courses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasRole("ADMIN")
                
                .requestMatchers(HttpMethod.GET, "/api/cvs/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/cvs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/cvs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/cvs/**").hasRole("ADMIN")
                
                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/posts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasRole("ADMIN")
                
                // Documentation and monitoring
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                
                // Static resources
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
