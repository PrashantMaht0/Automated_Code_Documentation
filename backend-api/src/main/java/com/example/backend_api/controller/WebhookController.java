package com.example.backend_api.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend_api.dto.GithubPushPayload;
import com.example.backend_api.model.Project;
import com.example.backend_api.repository.ProjectRepository;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final ProjectRepository projectRepository;

    @Autowired
    public WebhookController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @PostMapping("/github")
    public ResponseEntity<String> handleGithubPush(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "unknown") String githubEvent,
            @RequestBody GithubPushPayload payload) {

        // 1. We only care about 'push' events for logging commits
        if (!"push".equals(githubEvent)) {
            return ResponseEntity.ok("Ignored non-push event.");
        }

        // 2. Extract the repository name from the JSON
        if (payload.getRepository() == null || payload.getRepository().getFull_name() == null) {
            return ResponseEntity.badRequest().body("Invalid payload: Missing repository data.");
        }
        
        String repoName = payload.getRepository().getFull_name();

        // 3. Verify this repository is actively tracked in our Supabase database
        Optional<Project> trackedProject = projectRepository.findByRepoName(repoName);
        
        if (trackedProject.isEmpty()) {
            System.out.println(" Received push for untracked repository: " + repoName);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Repository not tracked.");
        }

        // 4. Process the commits (For now, we just print them to the console)
        System.out.println(" Push detected for tracked project: " + repoName);
        
        if (payload.getCommits() != null) {
            for (GithubPushPayload.Commit commit : payload.getCommits()) {
                System.out.println("   - Commit: [" + commit.getId().substring(0, 7) + "] " + commit.getMessage());
                System.out.println("     Author: " + commit.getAuthor().getName());
            }
        }

        // 5. Always return a 200 OK fast so GitHub doesn't timeout
        return ResponseEntity.ok("Push event processed successfully.");
    }
}