package com.example.backend_api.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class ProjectRequest {
    private UUID userId;
    private String email; // Fallback in case we need to create the user on the fly
    private String repoName;
    private String webhookSecret;
}