package com.issuetracker.service;

import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.dto.ProjectDto;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public ProjectDto createProject(CreateProjectRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Project project = new Project();
        project.setName(request.getName());
        project.setOwner(owner);
        
        project = projectRepository.save(project);
        
        return convertToDto(project);
    }
    
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        return convertToDto(project);
    }
    
    @Transactional
    public ProjectDto updateProject(Long id, CreateProjectRequest request, String ownerEmail) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only owner can update
        if (!project.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only project owner can update the project");
        }
        
        project.setName(request.getName());
        project = projectRepository.save(project);
        
        return convertToDto(project);
    }
    
    @Transactional
    public void deleteProject(Long id, String ownerEmail) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only owner can delete
        if (!project.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only project owner can delete the project");
        }
        
        projectRepository.delete(project);
    }
    
    private ProjectDto convertToDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setOwnerId(project.getOwner().getId());
        dto.setOwnerName(project.getOwner().getName());
        dto.setCreatedAt(project.getCreatedAt());
        return dto;
    }
}
