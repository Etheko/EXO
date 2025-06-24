# Security Implementation Guide

## Overview

This document describes the comprehensive security implementation for the EXO portfolio application. The security system implements a multi-layered approach following the principle of defense in depth.

## Security Layers

### 1. Controller Layer (Method-Level Security)
- **Purpose**: Primary access control using Spring Security annotations
- **Implementation**: `@PreAuthorize("hasRole('ADMIN')")` annotations on controller methods
- **Coverage**: All creation, modification, and deletion operations

### 2. Service Layer (Business Logic Security)
- **Purpose**: Additional security checks at the business logic level
- **Implementation**: `SecurityService` utility class with role verification
- **Coverage**: Critical operations that require admin privileges

### 3. Global Exception Handling
- **Purpose**: Consistent error responses for security violations
- **Implementation**: `GlobalExceptionHandler` with custom exceptions
- **Coverage**: All security-related exceptions

## Security Configuration

### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize annotations
public class SecurityConfig {
    // Configuration for JWT authentication and authorization
}
```

### Public vs Protected Endpoints

#### Public Endpoints (No Authentication Required)
- `GET /api/auth/**` - Authentication endpoints
- `GET /api/test/**` - Health checks
- `GET /api/sections/**` - Read section data
- `GET /api/projects/**` - Read project data
- `GET /api/users/**` - Read user data
- `GET /api/certificates/**` - Read certificate data
- `GET /api/courses/**` - Read course data
- `GET /api/cvs/**` - Read CV data
- `GET /api/posts/**` - Read blog post data

#### Admin-Only Endpoints (Require ADMIN Role)
- `POST /api/sections/**` - Create sections
- `PUT /api/sections/**` - Update sections
- `DELETE /api/sections/**` - Delete sections
- `POST /api/projects/**` - Create projects
- `PUT /api/projects/**` - Update projects
- `DELETE /api/projects/**` - Delete projects
- `POST /api/users/**` - Create users
- `PUT /api/users/**` - Update users
- `DELETE /api/users/**` - Delete users
- And similar patterns for all other entities

## Implementation Details

### 1. Controller-Level Security

Example from `SectionController.java`:
```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
@Operation(summary = "Create new section", description = "Create a new section (Admin only)")
public ResponseEntity<Section> createSection(@RequestBody Section section) {
    return ResponseEntity.ok(sectionService.saveSection(section));
}
```

### 2. Service-Level Security

Example from `SectionService.java`:
```java
@Autowired
private SecurityService securityService;

public Section saveSection(Section section) {
    // Additional service-level security check
    if (!securityService.isCurrentUserAdmin()) {
        throw new UnauthorizedAccessException("Only administrators can save sections");
    }
    return sectionRepository.save(section);
}
```

### 3. Security Service Utility

The `SecurityService` provides utility methods for security checks:

```java
@Service
public class SecurityService {
    public boolean isCurrentUserAdmin() {
        // Check if current user has ADMIN role
    }
    
    public boolean hasRole(String role) {
        // Check if current user has specific role
    }
    
    public String getCurrentUsername() {
        // Get current authenticated username
    }
    
    public boolean isAuthenticated() {
        // Check if user is authenticated
    }
}
```

### 4. Custom Exceptions

```java
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
```

### 5. Global Exception Handler

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedAccess(
            UnauthorizedAccessException ex, WebRequest request) {
        // Return 403 Forbidden with detailed error message
    }
}
```

## Testing Security

### 1. Test Public Endpoints
```bash
# These should work without authentication
curl http://localhost:8080/api/sections
curl http://localhost:8080/api/projects
curl http://localhost:8080/api/users
```

### 2. Test Admin-Only Endpoints
```bash
# These should fail without admin token
curl -X POST http://localhost:8080/api/sections \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Section"}'

# Expected response: 403 Forbidden
```

### 3. Test with Admin Token
```bash
# First, login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use the returned access token
curl -X POST http://localhost:8080/api/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title":"Test Section"}'

# Expected response: 200 OK with created section
```

## Security Best Practices Implemented

### 1. Defense in Depth
- Multiple security layers (Controller + Service + Exception handling)
- Each layer provides additional protection

### 2. Principle of Least Privilege
- Public endpoints only for read operations
- Admin endpoints only for modification operations
- Clear separation of concerns

### 3. Secure by Default
- All modification operations require admin privileges
- Read operations are public (portfolio content should be accessible)
- Explicit security annotations on all sensitive operations

### 4. Comprehensive Error Handling
- Custom exceptions for security violations
- Consistent error responses
- No information leakage in error messages

### 5. JWT-Based Authentication
- Stateless authentication
- Token-based access control
- Secure token validation

## Adding Security to New Endpoints

### 1. Controller Level
```java
@PostMapping("/new-endpoint")
@PreAuthorize("hasRole('ADMIN')")
@Operation(summary = "New operation", description = "New operation (Admin only)")
public ResponseEntity<Object> newOperation() {
    return ResponseEntity.ok(service.newOperation());
}
```

### 2. Service Level
```java
public Object newOperation() {
    if (!securityService.isCurrentUserAdmin()) {
        throw new UnauthorizedAccessException("Only administrators can perform this operation");
    }
    // Business logic here
}
```

### 3. Exception Handling
The global exception handler will automatically handle security exceptions and return appropriate HTTP responses.

## Security Considerations

### 1. Token Management
- Access tokens have short expiration (15 minutes by default)
- Refresh tokens for longer sessions
- Secure token storage on client side

### 2. Role-Based Access Control
- Simple role system (ADMIN vs regular users)
- Easy to extend with additional roles if needed
- Clear permission boundaries

### 3. API Documentation
- Swagger/OpenAPI documentation includes security annotations
- Clear indication of which endpoints require authentication
- Example requests with proper authentication headers

### 4. Monitoring and Logging
- All security violations are logged
- Failed authentication attempts are tracked
- Access patterns can be monitored

## Troubleshooting

### Common Issues

1. **403 Forbidden on Admin Endpoints**
   - Ensure you're using a valid admin token
   - Check that the token hasn't expired
   - Verify the user has ADMIN role

2. **401 Unauthorized**
   - Token is missing or invalid
   - Token has expired
   - Authentication failed

3. **500 Internal Server Error**
   - Check application logs for detailed error messages
   - Verify all security dependencies are properly configured

### Debug Mode
To enable debug logging for security:
```properties
logging.level.org.springframework.security=DEBUG
logging.level.com.exo=DEBUG
```

## Future Enhancements

1. **Additional Roles**: Add USER, MODERATOR roles for more granular access control
2. **Resource-Level Security**: Implement ownership-based access (users can only modify their own content)
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Audit Logging**: Comprehensive audit trail for all operations
5. **Two-Factor Authentication**: Add 2FA for admin accounts
6. **API Key Management**: Support for API keys for external integrations 