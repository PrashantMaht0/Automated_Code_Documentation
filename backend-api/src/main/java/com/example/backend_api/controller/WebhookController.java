package com.example.backend_api.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.example.backend_api.dto.GithubPushPayload;
import com.example.backend_api.model.CommitLog;
import com.example.backend_api.model.Project;
import com.example.backend_api.repository.CommitLogRepository;
import com.example.backend_api.repository.ProjectRepository;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final ProjectRepository projectRepository;
    private final CommitLogRepository commitLogRepository;

    @Autowired
    public WebhookController(ProjectRepository projectRepository, CommitLogRepository commitLogRepository) {
        this.projectRepository = projectRepository;
        this.commitLogRepository = commitLogRepository;
    }

    @PostMapping("/github")
    public ResponseEntity<String> handleGithubPush(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "unknown") String githubEvent,
            @RequestBody GithubPushPayload payload) {

        if (!"push".equals(githubEvent)) {
            return ResponseEntity.ok("Ignored non-push event.");
        }

        if (payload.getRepository() == null || payload.getRepository().getFull_name() == null) {
            return ResponseEntity.badRequest().body("Invalid payload: Missing repository data.");
        }
        
        String repoName = payload.getRepository().getFull_name();

        Optional<Project> trackedProject = projectRepository.findByRepoName(repoName);
        
        if (trackedProject.isEmpty()) {
            System.out.println("Received push for untracked repository: " + repoName);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Repository not tracked.");
        }

        // --- NEW DATABASE LOGIC: Process Every Commit Individually ---
        int savedCount = 0;
        RestTemplate restTemplate = new RestTemplate();

        if (payload.getCommits() != null) {
            for (GithubPushPayload.Commit commit : payload.getCommits()) {
                
                // Only save if we haven't seen this specific commit hash before
                if (!commitLogRepository.existsByCommitHash(commit.getId())) {
                    CommitLog newLog = new CommitLog();
                    newLog.setProject(trackedProject.get());
                    newLog.setCommitHash(commit.getId());
                    newLog.setMessage(commit.getMessage());
                    
                    // Prefer username, fallback to display name
                    String authorName = commit.getAuthor().getUsername() != null ? 
                            commit.getAuthor().getUsername() : commit.getAuthor().getName();
                    newLog.setAuthor(authorName);
                    
                    // Parse GitHub's ISO-8601 timestamp string into a Java ZonedDateTime
                    newLog.setCommitTimestamp(java.time.ZonedDateTime.parse(commit.getTimestamp()));

                    // --- FETCH RAW CODE DIFF FROM GITHUB ---
                    try {
                        HttpHeaders headers = new HttpHeaders();
                        // This specific header tells GitHub to return plain text code diffs instead of JSON
                        headers.set("Accept", "application/vnd.github.v3.diff"); 
                        
                        HttpEntity<String> entity = new HttpEntity<>(headers);
                        String diffUrl = "https://api.github.com/repos/" + repoName + "/commits/" + commit.getId();
                        
                        ResponseEntity<String> diffResponse = 
                                restTemplate.exchange(diffUrl, HttpMethod.GET, entity, String.class);
                        
                        newLog.setRawDiff(diffResponse.getBody());
                    } catch (Exception e) {
                        System.err.println("Failed to fetch diff for commit " + commit.getId() + ": " + e.getMessage());
                        newLog.setRawDiff("Diff unavailable or repository is private.");
                    }
                    // ---------------------------------------

                    commitLogRepository.save(newLog);
                    savedCount++;
                }
            }
        }

        System.out.println("Saved " + savedCount + " new commits to database for: " + repoName);
        return ResponseEntity.ok("Push event processed successfully.");
    }
}