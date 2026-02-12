package com.issuetracker.dto;

import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;

public class IssueUpdateEvent {
    private String eventType; // CREATED, UPDATED, DELETED
    private Long issueId;
    private String title;
    private IssueStatus status;
    private IssuePriority priority;
    private Long projectId;
    
    public IssueUpdateEvent() {}
    
    public IssueUpdateEvent(String eventType, Long issueId, String title, IssueStatus status, 
                          IssuePriority priority, Long projectId) {
        this.eventType = eventType;
        this.issueId = issueId;
        this.title = title;
        this.status = status;
        this.priority = priority;
        this.projectId = projectId;
    }
    
    // Getters and Setters
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public Long getIssueId() {
        return issueId;
    }
    
    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
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
}
