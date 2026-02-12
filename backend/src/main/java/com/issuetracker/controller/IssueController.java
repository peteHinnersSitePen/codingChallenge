package com.issuetracker.controller;

import com.issuetracker.dto.CreateIssueRequest;
import com.issuetracker.dto.IssueDto;
import com.issuetracker.dto.PageResponse;
import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import com.issuetracker.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "http://localhost:4200")
public class IssueController {
    
    @Autowired
    private IssueService issueService;
    
    @PostMapping
    public ResponseEntity<?> createIssue(@Valid @RequestBody CreateIssueRequest request) {
        try {
            IssueDto issue = issueService.createIssue(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(issue);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<PageResponse<IssueDto>> getIssues(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String searchText
    ) {
        PageResponse<IssueDto> issues = issueService.getIssues(
            page, size, sortBy, sortDir, status, priority, assigneeId, projectId, searchText
        );
        return ResponseEntity.ok(issues);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getIssueById(@PathVariable Long id) {
        try {
            IssueDto issue = issueService.getIssueById(id);
            return ResponseEntity.ok(issue);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateIssue(@PathVariable Long id, 
                                        @Valid @RequestBody CreateIssueRequest request) {
        try {
            IssueDto issue = issueService.updateIssue(id, request);
            return ResponseEntity.ok(issue);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIssue(@PathVariable Long id) {
        try {
            issueService.deleteIssue(id);
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
