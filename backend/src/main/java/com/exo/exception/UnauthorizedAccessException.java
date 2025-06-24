package com.exo.exception;

/**
 * Exception thrown when a user attempts to access a resource or perform an action
 * for which they don't have the required permissions.
 */
public class UnauthorizedAccessException extends RuntimeException {
    
    public UnauthorizedAccessException(String message) {
        super(message);
    }
    
    public UnauthorizedAccessException(String message, Throwable cause) {
        super(message, cause);
    }
} 