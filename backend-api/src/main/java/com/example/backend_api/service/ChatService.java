package com.example.backend_api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import com.example.backend_api.model.ChatMessage;
import com.example.backend_api.model.CommitLog;
import com.example.backend_api.repository.ChatMessageRepository;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final ChatMessageRepository chatMessageRepository;
    private final AiService aiService;

    public ChatService(ChatClient.Builder chatClientBuilder, 
                       ChatMessageRepository chatMessageRepository, 
                       AiService aiService) {
        this.chatClient = chatClientBuilder.build();
        this.chatMessageRepository = chatMessageRepository;
        this.aiService = aiService;
    }

    public String processUserMessage(UUID projectId, String userMessageText) {
        
        ChatMessage userMessage = new ChatMessage();
        userMessage.setProjectId(projectId);
        userMessage.setRole("USER");
        userMessage.setContent(userMessageText);
        chatMessageRepository.save(userMessage);

        List<CommitLog> relevantCommits = aiService.performSmartSearch(projectId, userMessageText);
        
        String contextData = relevantCommits.stream()
                .map(log -> "Author: " + log.getAuthor() + " | Message: " + log.getMessage() + " | Diff: " + log.getRawDiff())
                .collect(Collectors.joining("\n\n"));

        String systemInstruction = """
                You are a senior Software Engineering Assistant for the AI-Dev-Logger platform. 
                Your job is to answer questions, generate weekly summaries, and write markdown reports based strictly on the codebase context provided below.
                If the context does not contain the answer, politely state that you do not have enough commit data.
                
                --- RECENT RELEVANT COMMITS ---
                %s
                """.formatted(contextData.isEmpty() ? "No relevant commits found." : contextData);

        List<ChatMessage> history = chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        
        List<org.springframework.ai.chat.messages.Message> promptMessages = new ArrayList<>();
        promptMessages.add(new SystemMessage(systemInstruction));
        
        int startIndex = Math.max(0, history.size() - 10);
        for (int i = startIndex; i < history.size(); i++) {
            ChatMessage dbMsg = history.get(i);
            if (dbMsg.getRole().equals("USER")) {
                promptMessages.add(new UserMessage(dbMsg.getContent()));
            } else {
                promptMessages.add(new org.springframework.ai.chat.messages.AssistantMessage(dbMsg.getContent()));
            }
        }

        String aiResponse = chatClient.prompt(new Prompt(promptMessages)).call().content();

        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setProjectId(projectId);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(aiResponse);
        chatMessageRepository.save(assistantMessage);

        return aiResponse;
    }
    
    public List<ChatMessage> getChatHistory(UUID projectId) {
        return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }
}