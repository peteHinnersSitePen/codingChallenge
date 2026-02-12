package com.issuetracker.service;

import com.issuetracker.dto.CommentDto;
import com.issuetracker.dto.CreateCommentRequest;
import com.issuetracker.model.Comment;
import com.issuetracker.model.Issue;
import com.issuetracker.model.User;
import com.issuetracker.repository.CommentRepository;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        
        return convertToDto(comment);
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
        
        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);
        
        return convertToDto(comment);
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
        
        commentRepository.delete(comment);
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
