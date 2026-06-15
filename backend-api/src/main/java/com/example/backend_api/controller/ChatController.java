package com.example.backend_api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend_api.dto.ChatRequest;
import com.example.backend_api.model.ChatMessage;
import com.example.backend_api.service.ChatService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable UUID projectId) {
        return ResponseEntity.ok(chatService.getChatHistory(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<String> sendMessage(
            @PathVariable UUID projectId, 
            @Valid @RequestBody ChatRequest request) { 
        
        String response = chatService.processUserMessage(projectId, request.getMessage());
        return ResponseEntity.ok(response);
    }
}