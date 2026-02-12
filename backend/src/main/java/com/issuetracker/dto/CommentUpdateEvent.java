package com.issuetracker.dto;

public class CommentUpdateEvent {
    private String eventType; // CREATED, UPDATED, DELETED
    private Long commentId;
    private Long issueId;
    private String content;
    private Long authorId;
    private String authorName;
    
    public CommentUpdateEvent() {}
    
    public CommentUpdateEvent(String eventType, Long commentId, Long issueId, String content, 
                             Long authorId, String authorName) {
        this.eventType = eventType;
        this.commentId = commentId;
        this.issueId = issueId;
        this.content = content;
        this.authorId = authorId;
        this.authorName = authorName;
    }
    
    // Getters and Setters
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public Long getCommentId() {
        return commentId;
    }
    
    public void setCommentId(Long commentId) {
        this.commentId = commentId;
    }
    
    public Long getIssueId() {
        return issueId;
    }
    
    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Long getAuthorId() {
        return authorId;
    }
    
    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
}
