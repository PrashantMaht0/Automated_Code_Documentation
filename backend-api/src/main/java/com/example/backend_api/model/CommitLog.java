package com.example.backend_api.model;

import java.time.ZonedDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "commit_logs")
public class CommitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", referencedColumnName = "id", nullable = false)
    private Project project;

    @Column(name = "commit_hash", nullable = false)
    private String commitHash;

    @Column(name = "message", columnDefinition = "text")
    private String message;

    @Column(name = "author")
    private String author;

    @Column(name = "commit_timestamp")
    private ZonedDateTime commitTimestamp;

    @Column(name = "ai_summary", columnDefinition = "text")
    private String aiSummary;

    // Add this right below the message or author fields
    @Column(name = "raw_diff", columnDefinition = "text")
    private String rawDiff;
    // ⚠️ Kept ready for the next phase!
    // @Column(columnDefinition = "vector")
    // private float[] embedding;
}