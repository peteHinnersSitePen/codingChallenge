package com.issuetracker.controller;

import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.dto.ProjectDto;
import com.issuetracker.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:4200")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    @PostMapping
    public ResponseEntity<?> createProject(@Valid @RequestBody CreateProjectRequest request, Authentication authentication) {
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            ProjectDto project = projectService.createProject(request, email);
            return ResponseEntity.status(HttpStatus.CREATED).body(project);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) String searchText) {
        List<ProjectDto> projects = projectService.getAllProjects(sortBy, sortDir, searchText);
        return ResponseEntity.ok(projects);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        try {
            ProjectDto project = projectService.getProjectById(id);
            return ResponseEntity.ok(project);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, 
                                          @Valid @RequestBody CreateProjectRequest request,
                                          Authentication authentication) {
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            ProjectDto project = projectService.updateProject(id, request, email);
            return ResponseEntity.ok(project);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, Authentication authentication) {
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            projectService.deleteProject(id, email);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
    }
}
