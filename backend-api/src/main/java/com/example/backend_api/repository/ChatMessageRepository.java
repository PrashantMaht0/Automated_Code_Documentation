package com.example.backend_api.repository;

import com.example.backend_api.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    // Grabs the chat history for a specific project, ordered sequentially
    List<ChatMessage> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
}