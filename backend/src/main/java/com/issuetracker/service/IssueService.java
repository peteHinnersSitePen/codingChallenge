package com.issuetracker.service;

import com.issuetracker.dto.CreateIssueRequest;
import com.issuetracker.dto.IssueDto;
import com.issuetracker.dto.IssueUpdateEvent;
import com.issuetracker.dto.PageResponse;
import com.issuetracker.model.ActivityType;
import com.issuetracker.model.Issue;
import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.stream.Collectors;

@Service
public class IssueService {
    
    @Autowired
    private IssueRepository issueRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ActivityLogService activityLogService;
    
    @Transactional
    public IssueDto createIssue(CreateIssueRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Get current authenticated user as creator
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails)) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.springframework.security.core.userdetails.UserDetails userDetails = 
            (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
        User creator = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Issue issue = new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setStatus(request.getStatus() != null ? request.getStatus() : IssueStatus.OPEN);
        issue.setPriority(request.getPriority() != null ? request.getPriority() : IssuePriority.MEDIUM);
        issue.setProject(project);
        issue.setCreator(creator);
        
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            issue.setAssignee(assignee);
        }
        
        issue = issueRepository.save(issue);
        
        // Reload with creator and assignee eagerly fetched to ensure DTO conversion works
        issue = issueRepository.findByIdWithCreatorAndAssignee(issue.getId())
            .orElse(issue); // Fallback to original if query fails
        
        // Create activity log for issue creation
        if (activityLogService != null) {
            try {
                activityLogService.createActivityLog(issue, ActivityType.ISSUE_CREATED, null, null);
            } catch (Exception e) {
                // Activity log creation failed - non-critical, continue with issue creation
            }
        }
        
        IssueDto dto = convertToDto(issue);
        
        // Publish WebSocket event after transaction commits
        if (messagingTemplate != null) {
            IssueUpdateEvent event = new IssueUpdateEvent(
                "CREATED",
                dto.getId(),
                dto.getTitle(),
                dto.getStatus(),
                dto.getPriority(),
                dto.getProjectId()
            );
            messagingTemplate.convertAndSend("/topic/issues", event);
        }
        
        return dto;
    }
    
    public PageResponse<IssueDto> getIssues(
        Integer page,
        Integer size,
        String sortBy,
        String sortDir,
        IssueStatus status,
        IssuePriority priority,
        Long assigneeId,
        Long projectId,
        String searchText
    ) {
        // Determine sort direction
        Sort.Direction direction = sortDir != null && sortDir.equalsIgnoreCase("desc") 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        
        // Determine primary sort field
        String primarySortField = sortBy != null ? sortBy : "createdAt";
        
        // Create sort with primary field and secondary sort by createdAt (descending) for consistent ordering
        // When primary sort values are equal, secondary sort ensures stable ordering matching frontend default
        // IMPORTANT: Always use createdAt DESC as secondary sort to match frontend default, regardless of primary sort direction
        // For enum fields (priority, status), we need to ensure secondary sort is always applied
        Sort sort;
        if (primarySortField.equals("createdAt")) {
            // If already sorting by createdAt, add ID as secondary for stability
            sort = Sort.by(direction, "createdAt")
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else if (primarySortField.equals("updatedAt")) {
            // If sorting by updatedAt, use createdAt DESC as secondary (not updatedAt again)
            sort = Sort.by(direction, "updatedAt")
                      .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else if (primarySortField.equals("priority") || primarySortField.equals("status")) {
            // For enum fields, explicitly ensure secondary sort is applied
            // Use both createdAt DESC and id ASC to guarantee stable ordering
            sort = Sort.by(direction, primarySortField)
                      .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else {
            // For other fields (title, etc.), use createdAt DESC as secondary
            sort = Sort.by(direction, primarySortField)
                      .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        }
        
        Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20, sort);
        
        Page<Issue> issuePage = issueRepository.findAllWithFilters(
            status,
            priority,
            assigneeId,
            projectId,
            searchText,
            pageable
        );
        
        return convertToPageResponse(issuePage);
    }
    
    public IssueDto getIssueById(Long id) {
        // Use custom query to eagerly fetch creator and assignee
        Issue issue = issueRepository.findByIdWithCreatorAndAssignee(id)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        return convertToDto(issue);
    }
    
    @Transactional
    public IssueDto updateIssue(Long id, CreateIssueRequest request) {
        Issue issue = issueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        // Store old values for activity tracking
        String oldTitle = issue.getTitle();
        String oldDescription = issue.getDescription();
        IssueStatus oldStatus = issue.getStatus();
        IssuePriority oldPriority = issue.getPriority();
        Long oldAssigneeId = issue.getAssignee() != null ? issue.getAssignee().getId() : null;
        
        // Update fields
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setStatus(request.getStatus());
        issue.setPriority(request.getPriority());
        
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            issue.setAssignee(assignee);
        } else {
            issue.setAssignee(null);
        }
        
        issue = issueRepository.save(issue);
        
        // Reload with creator and assignee eagerly fetched
        issue = issueRepository.findByIdWithCreatorAndAssignee(issue.getId())
            .orElse(issue); // Fallback to original if query fails
        
        // Create activity logs for changes
        if (activityLogService != null) {
            try {
                // Track title change
                if (!oldTitle.equals(request.getTitle())) {
                    activityLogService.createActivityLog(issue, ActivityType.TITLE_CHANGED, oldTitle, request.getTitle());
                }
                
                // Track description change
                String oldDesc = oldDescription != null ? oldDescription : "";
                String newDesc = request.getDescription() != null ? request.getDescription() : "";
                if (!oldDesc.equals(newDesc)) {
                    activityLogService.createActivityLog(issue, ActivityType.DESCRIPTION_CHANGED, oldDescription, request.getDescription());
                }
                
                // Track status change
                if (oldStatus != request.getStatus()) {
                    activityLogService.createActivityLog(issue, ActivityType.STATUS_CHANGED, 
                        oldStatus != null ? oldStatus.toString() : null, 
                        request.getStatus() != null ? request.getStatus().toString() : null);
                }
                
                // Track priority change
                if (oldPriority != request.getPriority()) {
                    activityLogService.createActivityLog(issue, ActivityType.PRIORITY_CHANGED, 
                        oldPriority != null ? oldPriority.toString() : null, 
                        request.getPriority() != null ? request.getPriority().toString() : null);
                }
                
                // Track assignee change
                Long newAssigneeId = request.getAssigneeId();
                if ((oldAssigneeId == null && newAssigneeId != null) || 
                    (oldAssigneeId != null && !oldAssigneeId.equals(newAssigneeId))) {
                    String oldAssigneeName = oldAssigneeId != null ? 
                        userRepository.findById(oldAssigneeId).map(User::getName).orElse("Unknown") : null;
                    String newAssigneeName = newAssigneeId != null ? 
                        userRepository.findById(newAssigneeId).map(User::getName).orElse("Unknown") : null;
                    activityLogService.createActivityLog(issue, ActivityType.ASSIGNEE_CHANGED, oldAssigneeName, newAssigneeName);
                }
            } catch (Exception e) {
                // Activity log creation failed - non-critical, continue with issue update
            }
        }
        
        IssueDto dto = convertToDto(issue);
        
        // Publish WebSocket event
        if (messagingTemplate != null) {
            IssueUpdateEvent event = new IssueUpdateEvent(
                "UPDATED",
                dto.getId(),
                dto.getTitle(),
                dto.getStatus(),
                dto.getPriority(),
                dto.getProjectId()
            );
            messagingTemplate.convertAndSend("/topic/issues", event);
        }
        
        return dto;
    }
    
    @Transactional
    public void deleteIssue(Long id) {
        Issue issue = issueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        Long projectId = issue.getProject().getId();
        String title = issue.getTitle();
        
        issueRepository.delete(issue);
        
        // Publish WebSocket event
        if (messagingTemplate != null) {
            IssueUpdateEvent event = new IssueUpdateEvent(
                "DELETED",
                id,
                title,
                issue.getStatus(),
                issue.getPriority(),
                projectId
            );
            messagingTemplate.convertAndSend("/topic/issues", event);
        }
    }
    
    private IssueDto convertToDto(Issue issue) {
        IssueDto dto = new IssueDto();
        dto.setId(issue.getId());
        dto.setTitle(issue.getTitle());
        dto.setDescription(issue.getDescription());
        dto.setStatus(issue.getStatus());
        dto.setPriority(issue.getPriority());
        dto.setProjectId(issue.getProject().getId());
        dto.setProjectName(issue.getProject().getName());
        
        // Set creator if available
        if (issue.getCreator() != null) {
            dto.setCreatorId(issue.getCreator().getId());
            dto.setCreatorName(issue.getCreator().getName());
        }
        
        // Set assignee if available
        try {
            User assignee = issue.getAssignee();
            if (assignee != null) {
                dto.setAssigneeId(assignee.getId());
                dto.setAssigneeName(assignee.getName());
            }
        } catch (Exception e) {
            // Assignee might be null or not loaded - that's okay
        }
        
        dto.setCreatedAt(issue.getCreatedAt());
        dto.setUpdatedAt(issue.getUpdatedAt());
        
        return dto;
    }
    
    private PageResponse<IssueDto> convertToPageResponse(Page<Issue> issuePage) {
        return new PageResponse<>(
            issuePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()),
            issuePage.getNumber(),
            issuePage.getSize(),
            issuePage.getTotalElements(),
            issuePage.getTotalPages(),
            issuePage.isLast()
        );
    }
}
