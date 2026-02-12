package com.issuetracker.service;

import com.issuetracker.dto.CommentDto;
import com.issuetracker.dto.CommentUpdateEvent;
import com.issuetracker.dto.CreateCommentRequest;
import com.issuetracker.model.ActivityType;
import com.issuetracker.model.Comment;
import com.issuetracker.model.Issue;
import com.issuetracker.model.User;
import com.issuetracker.repository.CommentRepository;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private IssueRepository issueRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ActivityLogService activityLogService;
    
    @Transactional
    public CommentDto createComment(Long issueId, CreateCommentRequest request) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new RuntimeException("User not authenticated");
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User author = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setIssue(issue);
        comment.setAuthor(author);
        
        comment = commentRepository.save(comment);
        
        CommentDto dto = convertToDto(comment);
        
        // Activity log: comment added
        if (activityLogService != null) {
            try {
                activityLogService.createActivityLog(issue, ActivityType.COMMENT_ADDED, null, null);
            } catch (Exception e) {
                // Activity log creation failed - non-critical, continue with comment creation
            }
        }
        
        // Publish WebSocket event
        CommentUpdateEvent event = new CommentUpdateEvent(
            "CREATED",
            dto.getId(),
            issueId,
            dto.getContent(),
            dto.getAuthorId(),
            dto.getAuthorName()
        );
        messagingTemplate.convertAndSend("/topic/issues/" + issueId + "/comments", event);
        
        return dto;
    }
    
    public List<CommentDto> getCommentsByIssueId(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        List<Comment> comments = commentRepository.findByIssueOrderByCreatedAtAsc(issue);
        return comments.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public CommentDto updateComment(Long commentId, CreateCommentRequest request) {
        // Fetch comment with author eagerly loaded
        Comment comment = commentRepository.findByIdWithAuthor(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Verify current user is the author - compare by email
        String currentUserEmail = getCurrentUserEmail();
        String authorEmail = comment.getAuthor().getEmail();
        if (!authorEmail.equals(currentUserEmail)) {
            throw new RuntimeException("You can only edit your own comments");
        }
        
        String oldContent = comment.getContent();
        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);
        
        // Activity log: comment edited
        if (activityLogService != null) {
            try {
                Issue issue = comment.getIssue();
                String newContent = request.getContent();
                String oldTruncated = oldContent != null && oldContent.length() > 200 ? oldContent.substring(0, 200) + "..." : oldContent;
                String newTruncated = newContent != null && newContent.length() > 200 ? newContent.substring(0, 200) + "..." : newContent;
                activityLogService.createActivityLog(issue, ActivityType.COMMENT_EDITED, oldTruncated, newTruncated);
            } catch (Exception e) {
                // Activity log creation failed - non-critical, continue with comment update
            }
        }
        
        CommentDto dto = convertToDto(comment);
        
        // Publish WebSocket event
        CommentUpdateEvent event = new CommentUpdateEvent(
            "UPDATED",
            dto.getId(),
            comment.getIssue().getId(),
            dto.getContent(),
            dto.getAuthorId(),
            dto.getAuthorName()
        );
        messagingTemplate.convertAndSend("/topic/issues/" + comment.getIssue().getId() + "/comments", event);
        
        return dto;
    }
    
    @Transactional
    public void deleteComment(Long commentId) {
        // Fetch comment with author eagerly loaded
        Comment comment = commentRepository.findByIdWithAuthor(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // Verify current user is the author - compare by email
        String currentUserEmail = getCurrentUserEmail();
        String authorEmail = comment.getAuthor().getEmail();
        if (!authorEmail.equals(currentUserEmail)) {
            throw new RuntimeException("You can only delete your own comments");
        }
        
        // Store values before deletion
        Issue issue = issueRepository.findById(comment.getIssue().getId())
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        Long issueId = issue.getId();
        Long deletedCommentId = comment.getId();
        Long authorId = comment.getAuthor().getId();
        String authorName = comment.getAuthor().getName();
        
        commentRepository.delete(comment);
        
        // Activity log: comment deleted
        if (activityLogService != null) {
            try {
                activityLogService.createActivityLog(issue, ActivityType.COMMENT_DELETED, null, null);
            } catch (Exception e) {
                // Activity log creation failed - non-critical, continue with comment deletion
            }
        }
        
        // Publish WebSocket event
        CommentUpdateEvent event = new CommentUpdateEvent(
            "DELETED",
            deletedCommentId,
            issueId,
            null,
            authorId,
            authorName
        );
        messagingTemplate.convertAndSend("/topic/issues/" + issueId + "/comments", event);
    }
    
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new RuntimeException("User not authenticated");
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername(); // Username is the email
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new RuntimeException("User not authenticated");
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    private CommentDto convertToDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAuthorId(comment.getAuthor().getId());
        dto.setAuthorName(comment.getAuthor().getName());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}
