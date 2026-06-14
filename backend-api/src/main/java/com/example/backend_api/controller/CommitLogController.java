package com.example.backend_api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend_api.model.CommitLog;
import com.example.backend_api.repository.CommitLogRepository;
import com.example.backend_api.service.AiService;

@RestController
@RequestMapping("/api/logs")
public class CommitLogController {

    private final CommitLogRepository commitLogRepository;
    private final AiService aiService;

    @Autowired
    public CommitLogController(CommitLogRepository commitLogRepository, AiService aiService) {
        this.commitLogRepository = commitLogRepository;
        this.aiService = aiService;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CommitLog>> getLogsByProject(@PathVariable UUID projectId) {
        List<CommitLog> logs = commitLogRepository.findByProjectIdOrderByCommitTimestampDesc(projectId);
        return ResponseEntity.ok(logs);
    }

    // --- NEW: Smart Search Endpoint ---
    @GetMapping("/project/{projectId}/search")
    public ResponseEntity<List<CommitLog>> searchLogs(
            @PathVariable UUID projectId,
            @RequestParam String query) {
        List<CommitLog> logs = aiService.performSmartSearch(projectId, query);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/project/{projectId}/backfill")
    public ResponseEntity<String> triggerEmbeddingBackfill(@PathVariable UUID projectId) {
        aiService.backfillMissingEmbeddings(projectId);
        return ResponseEntity.ok("Backfill process started in the background. Check your Spring Boot console!");
    }
}