package com.issuetracker.dto;

import com.issuetracker.model.ActivityType;

public class ActivityLogUpdateEvent {
    private String eventType; // CREATED
    private Long activityLogId;
    private Long issueId;
    private ActivityType activityType;
    private Long userId;
    private String userName;
    private String oldValue;
    private String newValue;
    
    public ActivityLogUpdateEvent() {}
    
    public ActivityLogUpdateEvent(String eventType, Long activityLogId, Long issueId, 
                                   ActivityType activityType, Long userId, String userName,
                                   String oldValue, String newValue) {
        this.eventType = eventType;
        this.activityLogId = activityLogId;
        this.issueId = issueId;
        this.activityType = activityType;
        this.userId = userId;
        this.userName = userName;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
    
    // Getters and Setters
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public Long getActivityLogId() {
        return activityLogId;
    }
    
    public void setActivityLogId(Long activityLogId) {
        this.activityLogId = activityLogId;
    }
    
    public Long getIssueId() {
        return issueId;
    }
    
    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }
    
    public ActivityType getActivityType() {
        return activityType;
    }
    
    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public String getOldValue() {
        return oldValue;
    }
    
    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }
    
    public String getNewValue() {
        return newValue;
    }
    
    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }
}
