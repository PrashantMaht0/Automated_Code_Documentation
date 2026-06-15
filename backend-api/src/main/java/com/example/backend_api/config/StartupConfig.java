package com.example.backend_api.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.backend_api.repository.ProjectRepository;
import com.example.backend_api.service.AiService;


@Configuration
public class StartupConfig {

    @Bean
    public CommandLineRunner runOnStartup(AiService aiService, ProjectRepository projectRepository) {
        return args -> {
            System.out.println("Server started. Checking for missing embeddings...");
            
            projectRepository.findAll().forEach(project -> {
                aiService.backfillMissingEmbeddings(project.getId());
            });
        };
    }
}