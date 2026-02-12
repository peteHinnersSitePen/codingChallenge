package com.issuetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(min = 1, max = 200, message = "Project name must be between 1 and 200 characters")
    private String name;
    
    public CreateProjectRequest() {}
    
    public CreateProjectRequest(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}
