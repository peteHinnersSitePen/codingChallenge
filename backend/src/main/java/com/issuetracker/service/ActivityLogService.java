package com.issuetracker.service;

import com.issuetracker.dto.ActivityLogDto;
import com.issuetracker.model.ActivityLog;
import com.issuetracker.model.ActivityType;
import com.issuetracker.model.Issue;
import com.issuetracker.model.User;
import com.issuetracker.repository.ActivityLogRepository;
import com.issuetracker.repository.IssueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityLogService {
    
    @Autowired
    private ActivityLogRepository activityLogRepository;
    
    @Autowired
    private IssueRepository issueRepository;
    
    @Autowired
    private com.issuetracker.repository.UserRepository userRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public List<ActivityLogDto> getActivityLogsByIssueId(Long issueId) {
        List<ActivityLog> logs = activityLogRepository.findByIssueIdOrderByCreatedAtDesc(issueId);
        return logs.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public ActivityLogDto createActivityLog(Issue issue, ActivityType activityType, 
                                             String oldValue, String newValue) {
        // Re-fetch issue in this transaction so we have a managed entity (caller may pass detached)
        Issue managedIssue = issueRepository.findById(issue.getId())
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        // Get current authenticated user
        org.springframework.security.core.Authentication authentication = 
            SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new RuntimeException("User not authenticated");
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        ActivityLog log = new ActivityLog();
        log.setIssue(managedIssue);
        log.setActivityType(activityType);
        log.setUser(user);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        
        log = activityLogRepository.save(log);
        
        ActivityLogDto dto = convertToDto(log);
        
        // Publish WebSocket event
        if (messagingTemplate != null) {
            com.issuetracker.dto.ActivityLogUpdateEvent event = 
                new com.issuetracker.dto.ActivityLogUpdateEvent(
                    "CREATED",
                    dto.getId(),
                    issue.getId(),
                    dto.getActivityType(),
                    dto.getUserId(),
                    dto.getUserName(),
                    dto.getOldValue(),
                    dto.getNewValue()
                );
            messagingTemplate.convertAndSend("/topic/issues/" + managedIssue.getId() + "/activities", event);
        }
        
        return dto;
    }
    
    private ActivityLogDto convertToDto(ActivityLog log) {
        ActivityLogDto dto = new ActivityLogDto();
        dto.setId(log.getId());
        dto.setActivityType(log.getActivityType());
        dto.setUserId(log.getUser().getId());
        dto.setUserName(log.getUser().getName());
        dto.setOldValue(log.getOldValue());
        dto.setNewValue(log.getNewValue());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
