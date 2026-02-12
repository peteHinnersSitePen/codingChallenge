package com.issuetracker.dto;

import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import java.time.LocalDateTime;

public class IssueDto {
    private Long id;
    private String title;
    private String description;
    private IssueStatus status;
    private IssuePriority priority;
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public IssueDto() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public String getProjectName() {
        return projectName;
    }
    
    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }
    
    public Long getAssigneeId() {
        return assigneeId;
    }
    
    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }
    
    public String getAssigneeName() {
        return assigneeName;
    }
    
    public void setAssigneeName(String assigneeName) {
        this.assigneeName = assigneeName;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
