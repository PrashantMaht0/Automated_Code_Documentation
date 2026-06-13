package com.example.backend_api.controller;

import com.example.backend_api.model.CommitLog;
import com.example.backend_api.repository.CommitLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/logs")
public class CommitLogController {

    private final CommitLogRepository commitLogRepository;

    @Autowired
    public CommitLogController(CommitLogRepository commitLogRepository) {
        this.commitLogRepository = commitLogRepository;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CommitLog>> getLogsByProject(@PathVariable UUID projectId) {
        List<CommitLog> logs = commitLogRepository.findByProjectIdOrderByCommitTimestampDesc(projectId);
        return ResponseEntity.ok(logs);
    }
}