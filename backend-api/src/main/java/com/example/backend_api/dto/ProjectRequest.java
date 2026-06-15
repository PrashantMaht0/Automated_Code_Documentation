package com.example.backend_api.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class ProjectRequest {
    private UUID userId;
    private String email; 
    private String repoName;
    private String webhookSecret;
}