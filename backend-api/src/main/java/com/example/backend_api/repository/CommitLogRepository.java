package com.example.backend_api.repository;

import com.example.backend_api.model.CommitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommitLogRepository extends JpaRepository<CommitLog, UUID> {
    // Fetches logs for the dashboard, newest first
    List<CommitLog> findByProjectIdOrderByCommitTimestampDesc(UUID projectId);
    
    // Safety check to prevent saving the same commit twice
    boolean existsByCommitHash(String commitHash);
}