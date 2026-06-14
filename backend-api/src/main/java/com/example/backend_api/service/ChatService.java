package com.example.backend_api.service;

import com.example.backend_api.model.ChatMessage;
import com.example.backend_api.model.CommitLog;
import com.example.backend_api.repository.ChatMessageRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
        // 1. Save the User's message to the database
        ChatMessage userMessage = new ChatMessage();
        userMessage.setProjectId(projectId);
        userMessage.setRole("USER");
        userMessage.setContent(userMessageText);
        chatMessageRepository.save(userMessage);

        // 2. Perform a Vector Search to find commits relevant to what the user is asking
        List<CommitLog> relevantCommits = aiService.performSmartSearch(projectId, userMessageText);
        
        // Format the commits into a readable string for the AI
        String contextData = relevantCommits.stream()
                .map(log -> "Author: " + log.getAuthor() + " | Message: " + log.getMessage() + " | Diff: " + log.getRawDiff())
                .collect(Collectors.joining("\n\n"));

        // 3. Define the AI's Persona and give it the Context
        String systemInstruction = """
                You are a senior Software Engineering Assistant for the AI-Dev-Logger platform. 
                Your job is to answer questions, generate weekly summaries, and write markdown reports based strictly on the codebase context provided below.
                If the context does not contain the answer, politely state that you do not have enough commit data.
                
                --- RECENT RELEVANT COMMITS ---
                %s
                """.formatted(contextData.isEmpty() ? "No relevant commits found." : contextData);

        // 4. Fetch the recent conversation history (so it remembers follow-up questions)
        List<ChatMessage> history = chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        
        List<org.springframework.ai.chat.messages.Message> promptMessages = new ArrayList<>();
        promptMessages.add(new SystemMessage(systemInstruction));
        
        // Add the last 10 messages from the database to the prompt
        int startIndex = Math.max(0, history.size() - 10);
        for (int i = startIndex; i < history.size(); i++) {
            ChatMessage dbMsg = history.get(i);
            if (dbMsg.getRole().equals("USER")) {
                promptMessages.add(new UserMessage(dbMsg.getContent()));
            } else {
                promptMessages.add(new org.springframework.ai.chat.messages.AssistantMessage(dbMsg.getContent()));
            }
        }

        // 5. Send everything to Gemini and get the response
        String aiResponse = chatClient.prompt(new Prompt(promptMessages)).call().content();

        // 6. Save Gemini's response to the database
        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setProjectId(projectId);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(aiResponse);
        chatMessageRepository.save(assistantMessage);

        return aiResponse;
    }
    
    // Quick method to load history when the user opens the slide-out sidebar
    public List<ChatMessage> getChatHistory(UUID projectId) {
        return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }
}