package com.example.backend_api.controller;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.example.backend_api.dto.ProjectRequest;
import com.example.backend_api.model.Project;
import com.example.backend_api.model.User;
import com.example.backend_api.repository.ProjectRepository;
import com.example.backend_api.repository.UserRepository;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectController(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Project>> getProjectsByUser(@PathVariable UUID userId) {
        List<Project> projects = projectRepository.findByUserId(userId);
        return ResponseEntity.ok(projects);
    }    

    @PutMapping("/{projectId}/secret")
    public ResponseEntity<Project> updateWebhookSecret(
            @PathVariable UUID projectId,
            @RequestBody String newSecret) {
        
        return projectRepository.findById(Objects.requireNonNull(projectId, "projectId")).map(project -> {
            project.setWebhookSecret(newSecret);
            return ResponseEntity.ok(projectRepository.save(project));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Object> createProject(@RequestBody ProjectRequest request) {
        
        if (projectRepository.findByRepoNameAndUserId(request.getRepoName(), request.getUserId()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You are already tracking this repository.");
        }            
        User user = userRepository.findById(Objects.requireNonNull(request.getUserId(), "userId")).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(request.getUserId());
            newUser.setEmail(request.getEmail());
            
            newUser.setGithubUserId(System.currentTimeMillis()); 
            
            
            return userRepository.save(newUser);
        });

        // 2. Create and configure the new Project
        Project project = new Project();
        project.setUser(user);
        project.setRepoName(request.getRepoName());
        project.setWebhookSecret(request.getWebhookSecret());
        
        // FIX: Provide a default value for the NON-NULLABLE github_installation_id column
        project.setGithubInstallationId(0L); 

        // 3. Save to database and return the created object to React
        Project savedProject = projectRepository.save(project);
        
        return ResponseEntity.ok(savedProject);
    }
}