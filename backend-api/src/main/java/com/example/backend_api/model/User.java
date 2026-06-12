package com.example.backend_api.model;

import java.time.ZonedDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "github_token")
    private String githubToken;

    @Column(name = "github_user_id")
    private Long githubUserId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

}