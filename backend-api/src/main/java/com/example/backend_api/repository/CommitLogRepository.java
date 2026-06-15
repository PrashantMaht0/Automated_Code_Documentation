package com.example.backend_api.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend_api.model.CommitLog;

@Repository
public interface CommitLogRepository extends JpaRepository<CommitLog, UUID> {
    
    List<CommitLog> findByProjectIdOrderByCommitTimestampDesc(UUID projectId);
    
    boolean existsByCommitHash(String commitHash);

    @Query(value = "SELECT * FROM match_commit_logs(cast(:queryEmbedding as vector), :threshold, :limit, cast(:projectId as uuid))", nativeQuery = true)
    List<CommitLog> searchBySimilarity(
            @Param("queryEmbedding") String queryEmbedding, 
            @Param("threshold") double threshold, 
            @Param("limit") int limit, 
            @Param("projectId") UUID projectId
    );
}