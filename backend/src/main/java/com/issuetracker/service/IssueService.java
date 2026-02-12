package com.issuetracker.service;

import com.issuetracker.dto.CreateIssueRequest;
import com.issuetracker.dto.IssueDto;
import com.issuetracker.dto.IssueUpdateEvent;
import com.issuetracker.dto.PageResponse;
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
    
    @Transactional
    public IssueDto createIssue(CreateIssueRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        Issue issue = new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setStatus(request.getStatus() != null ? request.getStatus() : IssueStatus.OPEN);
        issue.setPriority(request.getPriority() != null ? request.getPriority() : IssuePriority.MEDIUM);
        issue.setProject(project);
        
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            issue.setAssignee(assignee);
        }
        
        issue = issueRepository.save(issue);
        
        IssueDto dto = convertToDto(issue);
        
        // Publish WebSocket event after transaction commits
        IssueUpdateEvent event = new IssueUpdateEvent(
            "CREATED",
            dto.getId(),
            dto.getTitle(),
            dto.getStatus(),
            dto.getPriority(),
            dto.getProjectId()
        );
        messagingTemplate.convertAndSend("/topic/issues", event);
        
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
        Sort sort = Sort.by(sortDir != null && sortDir.equalsIgnoreCase("desc") 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC, 
            sortBy != null ? sortBy : "createdAt");
        
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
        Issue issue = issueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
        return convertToDto(issue);
    }
    
    @Transactional
    public IssueDto updateIssue(Long id, CreateIssueRequest request) {
        Issue issue = issueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Issue not found"));
        
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
        
        IssueDto dto = convertToDto(issue);
        
        // Publish WebSocket event
        IssueUpdateEvent event = new IssueUpdateEvent(
            "UPDATED",
            dto.getId(),
            dto.getTitle(),
            dto.getStatus(),
            dto.getPriority(),
            dto.getProjectId()
        );
        messagingTemplate.convertAndSend("/topic/issues", event);
        
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
    
    private IssueDto convertToDto(Issue issue) {
        IssueDto dto = new IssueDto();
        dto.setId(issue.getId());
        dto.setTitle(issue.getTitle());
        dto.setDescription(issue.getDescription());
        dto.setStatus(issue.getStatus());
        dto.setPriority(issue.getPriority());
        dto.setProjectId(issue.getProject().getId());
        dto.setProjectName(issue.getProject().getName());
        
        if (issue.getAssignee() != null) {
            dto.setAssigneeId(issue.getAssignee().getId());
            dto.setAssigneeName(issue.getAssignee().getName());
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
