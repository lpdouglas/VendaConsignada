package com.vendaconsignada.estoque.controller;

import com.mongodb.MongoTimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(error(ex.getStatusCode().value(), ex.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> "Campo invalido: " + error.getField())
                .orElse("Dados invalidos");
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST.value(), message));
    }

    @ExceptionHandler(MongoTimeoutException.class)
    public ResponseEntity<Map<String, Object>> handleMongoTimeout(MongoTimeoutException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(error(HttpStatus.SERVICE_UNAVAILABLE.value(), "MongoDB indisponivel em localhost:27017"));
    }

    private Map<String, Object> error(int status, String message) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", status,
                "message", message
        );
    }
}
