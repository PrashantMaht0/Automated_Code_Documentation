package com.example.backend_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {
    
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 1000, message = "Message must be 1000 characters or less")
    private String message;
}