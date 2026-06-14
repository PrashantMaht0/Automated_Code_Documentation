package com.example.backend_api.controller;

import com.example.backend_api.model.ChatMessage;
import com.example.backend_api.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // Loads previous messages when you open the sidebar
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable UUID projectId) {
        return ResponseEntity.ok(chatService.getChatHistory(projectId));
    }

    // Processes a new message through Gemini
    @PostMapping("/project/{projectId}")
    public ResponseEntity<String> sendMessage(@PathVariable UUID projectId, @RequestBody String message) {
        String response = chatService.processUserMessage(projectId, message);
        return ResponseEntity.ok(response);
    }
}