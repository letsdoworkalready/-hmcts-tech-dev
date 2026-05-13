package uk.gov.hmcts.reform.dev.exception;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleTaskNotFound(TaskNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody(
            HttpStatus.NOT_FOUND, ex.getMessage(), null
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String detail = cause != null && cause.getMessage() != null ? cause.getMessage() : ex.getMessage();
        log.warn("Could not read request body: {}", detail);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
            HttpStatus.BAD_REQUEST, detail != null ? detail : "Invalid request body", null
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
            HttpStatus.BAD_REQUEST, "Validation failed", errors
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> errors = ex.getConstraintViolations().stream()
            .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
            HttpStatus.BAD_REQUEST, "Validation failed", errors
        ));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> handleMissingHeader(MissingRequestHeaderException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(
            HttpStatus.BAD_REQUEST, "Required header missing: " + ex.getHeaderName(), null
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody(
            HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null
        ));
    }

    private Map<String, Object> errorBody(HttpStatus status, String message, List<String> errors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        if (errors != null) {
            body.put("errors", errors);
        }
        return body;
    }
}
