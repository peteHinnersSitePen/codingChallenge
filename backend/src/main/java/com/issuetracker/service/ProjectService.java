package com.issuetracker.service;

import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.dto.ProjectDto;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
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
    
    public List<ProjectDto> getAllProjects(String sortBy, String sortDir, String searchText) {
        Sort.Direction direction = sortDir != null && sortDir.equalsIgnoreCase("desc") 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        
        String primarySortField = sortBy != null ? sortBy : "name";
        
        Sort sort;
        if (primarySortField.equals("name")) {
            sort = Sort.by(direction, "name")
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else if (primarySortField.equals("createdAt")) {
            sort = Sort.by(direction, "createdAt")
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else if (primarySortField.equals("updatedAt")) {
            sort = Sort.by(direction, "updatedAt")
                      .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        } else {
            // Default to name if invalid sort field
            sort = Sort.by(direction, "name")
                      .and(Sort.by(Sort.Direction.ASC, "id"));
        }
        
        // Get filtered projects if searchText is provided
        List<Project> projects;
        if (searchText != null && !searchText.trim().isEmpty()) {
            projects = projectRepository.findAllWithSearch(searchText.trim());
        } else {
            projects = projectRepository.findAll(sort);
        }
        
        // Apply sorting to filtered results
        // Note: We need to sort in memory since findAllWithSearch doesn't support Sort parameter
        // For simplicity, we'll sort the list manually
        if (searchText != null && !searchText.trim().isEmpty()) {
            // Sort the filtered list
            java.util.Comparator<Project> comparator = null;
            if (primarySortField.equals("name")) {
                comparator = direction == Sort.Direction.ASC 
                    ? java.util.Comparator.comparing(Project::getName)
                    : java.util.Comparator.comparing(Project::getName).reversed();
            } else if (primarySortField.equals("createdAt")) {
                comparator = direction == Sort.Direction.ASC 
                    ? java.util.Comparator.comparing(Project::getCreatedAt)
                    : java.util.Comparator.comparing(Project::getCreatedAt).reversed();
            } else if (primarySortField.equals("updatedAt")) {
                comparator = direction == Sort.Direction.ASC 
                    ? java.util.Comparator.comparing(Project::getUpdatedAt)
                    : java.util.Comparator.comparing(Project::getUpdatedAt).reversed();
            }
            
            if (comparator != null) {
                projects = projects.stream()
                    .sorted(comparator.thenComparing(Project::getId))
                    .collect(Collectors.toList());
            }
        }
        
        return projects.stream()
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
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
