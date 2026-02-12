package com.issuetracker.dto;

import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateIssueRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private IssueStatus status = IssueStatus.OPEN;
    
    private IssuePriority priority = IssuePriority.MEDIUM;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    private Long assigneeId;
    
    public CreateIssueRequest() {}
    
    // Getters and Setters
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public IssueStatus getStatus() {
        return status;
    }
    
    public void setStatus(IssueStatus status) {
        this.status = status;
    }
    
    public IssuePriority getPriority() {
        return priority;
    }
    
    public void setPriority(IssuePriority priority) {
        this.priority = priority;
    }
    
    public Long getProjectId() {
        return projectId;
    }
    
    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }
    
    public Long getAssigneeId() {
        return assigneeId;
    }
    
    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }
}
