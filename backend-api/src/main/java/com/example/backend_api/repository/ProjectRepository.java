package com.example.backend_api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend_api.model.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByRepoName(String repoName);
    Optional<Project> findByRepoNameAndUserId(String repoName, UUID userId);
    List<Project> findByUserId(UUID userId);
}