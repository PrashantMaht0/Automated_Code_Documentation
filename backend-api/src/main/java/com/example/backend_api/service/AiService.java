package com.example.backend_api.service;

import java.util.List;
import java.util.UUID;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel; // 1. NEW IMPORT
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.backend_api.model.CommitLog;
import com.example.backend_api.repository.CommitLogRepository;

@Service
public class AiService {

    private final ChatClient chatClient;
    private final CommitLogRepository commitLogRepository;
    private final EmbeddingModel embeddingModel; // 2. NEW FIELD

    // 3. UPDATED CONSTRUCTOR
    public AiService(ChatClient.Builder chatClientBuilder, 
                     CommitLogRepository commitLogRepository, 
                     EmbeddingModel embeddingModel) { 
        this.chatClient = chatClientBuilder.build();
        this.commitLogRepository = commitLogRepository;
        this.embeddingModel = embeddingModel;
    }

    @Async
    public void generateAndSaveSummary(UUID commitLogId, String rawDiff) {
        if (rawDiff == null || rawDiff.isBlank() || rawDiff.equals("Diff unavailable or repository is private.")) {
            return;
        }

        try {
            String prompt = "You are a senior software engineer. Analyze the following git diff and summarize the code changes in exactly one concise, professional sentence. Do not use markdown formatting or introductory phrases.\n\nDiff:\n" + rawDiff;

            String summary = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            commitLogRepository.findById(commitLogId).ifPresent(log -> {
                log.setAiSummary(summary.trim());
                commitLogRepository.save(log);
            });

            System.out.println("AI Summary generated for commit: " + commitLogId);

        } catch (Exception e) {
            System.err.println("AI generation failed: " + e.getMessage());
        }
    }

    // 4. THE WEBHOOK EMBEDDING GENERATOR
    @Async
    public void generateAndSaveEmbedding(UUID commitLogId, String message, String rawDiff) {
        if (rawDiff == null || rawDiff.isBlank() || rawDiff.equals("Diff unavailable or repository is private.")) {
            return;
        }

        try {
            String contentToEmbed = "Commit Message: " + message + "\n\nCode Changes:\n" + rawDiff;
            float[] vector = embeddingModel.embed(contentToEmbed);

            commitLogRepository.findById(commitLogId).ifPresent(log -> {
                log.setEmbedding(vector);
                commitLogRepository.save(log);
            });

            System.out.println("Vector Embedding generated and saved for commit: " + commitLogId);

        } catch (Exception e) {
            System.err.println("Embedding generation failed: " + e.getMessage());
        }
    }

    // 5. THE SMART SEARCH METHOD
    public List<CommitLog> performSmartSearch(UUID projectId, String searchQuery) {
        // Turn the user's search text into a math vector
        float[] queryVector = embeddingModel.embed(searchQuery);
        
        // Convert float[] to the string format PostgreSQL expects: "[0.1, 0.2, ...]"
        StringBuilder vectorString = new StringBuilder("[");
        for (int i = 0; i < queryVector.length; i++) {
            vectorString.append(queryVector[i]);
            if (i < queryVector.length - 1) vectorString.append(",");
        }
        vectorString.append("]");

        // Search the database!
        return commitLogRepository.searchBySimilarity(vectorString.toString(), 0.5, 5, projectId);
    }

    public void backfillMissingEmbeddings(UUID projectId) {
        // Fetch all logs for the project
        List<CommitLog> logs = commitLogRepository.findByProjectIdOrderByCommitTimestampDesc(projectId);
        
        int count = 0;
        for (CommitLog log : logs) {
            // Only process logs that don't have an embedding yet
            if (log.getEmbedding() == null) {
                // Re-use our existing async method!
                generateAndSaveEmbedding(log.getId(), log.getMessage(), log.getRawDiff());
                count++;
            }
        }
        System.out.println("Started background backfill for " + count + " missing embeddings.");
    }
}