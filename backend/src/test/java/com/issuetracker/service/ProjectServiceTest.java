package com.issuetracker.service;

import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.dto.ProjectDto;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {
    
    @Mock
    private ProjectRepository projectRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private ProjectService projectService;
    
    private User testUser;
    private Project testProject;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        
        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");
        testProject.setOwner(testUser);
    }
    
    @Test
    void testCreateProject_Success() {
        // Given
        CreateProjectRequest request = new CreateProjectRequest("New Project");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });
        
        // When
        ProjectDto result = projectService.createProject(request, "test@example.com");
        
        // Then
        assertNotNull(result);
        assertEquals("New Project", result.getName());
        assertEquals(testUser.getId(), result.getOwnerId());
        verify(projectRepository, times(1)).save(any(Project.class));
    }
    
    @Test
    void testCreateProject_UserNotFound() {
        // Given
        CreateProjectRequest request = new CreateProjectRequest("New Project");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(RuntimeException.class, () -> {
            projectService.createProject(request, "test@example.com");
        });
    }
    
    @Test
    void testGetProjectById_Success() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.of(testProject));
        
        // When
        ProjectDto result = projectService.getProjectById(1L);
        
        // Then
        assertNotNull(result);
        assertEquals(testProject.getId(), result.getId());
        assertEquals(testProject.getName(), result.getName());
    }
    
    @Test
    void testGetProjectById_NotFound() {
        // Given
        when(projectRepository.findById(1L)).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(RuntimeException.class, () -> {
            projectService.getProjectById(1L);
        });
    }
}
