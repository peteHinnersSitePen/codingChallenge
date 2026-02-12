package com.issuetracker.controller;

import com.issuetracker.dto.CommentDto;
import com.issuetracker.dto.CreateCommentRequest;
import com.issuetracker.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/comments")
@CrossOrigin(origins = "http://localhost:4200")
public class CommentController {
    
    @Autowired
    private CommentService commentService;
    
    @GetMapping
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long issueId) {
        try {
            List<CommentDto> comments = commentService.getCommentsByIssueId(issueId);
            return ResponseEntity.ok(comments);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createComment(@PathVariable Long issueId, 
                                          @Valid @RequestBody CreateCommentRequest request) {
        try {
            CommentDto comment = commentService.createComment(issueId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long issueId,
                                          @PathVariable Long commentId,
                                          @Valid @RequestBody CreateCommentRequest request) {
        try {
            CommentDto comment = commentService.updateComment(commentId, request);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long issueId,
                                          @PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
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
