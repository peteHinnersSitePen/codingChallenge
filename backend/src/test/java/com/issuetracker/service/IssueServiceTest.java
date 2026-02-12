package com.issuetracker.service;

import com.issuetracker.dto.CreateIssueRequest;
import com.issuetracker.dto.IssueDto;
import com.issuetracker.dto.IssueUpdateEvent;
import com.issuetracker.model.Issue;
import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {
    
    @Mock
    private IssueRepository issueRepository;
    
    @Mock
    private ProjectRepository projectRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @InjectMocks
    private IssueService issueService;
    
    private Project testProject;
    private Issue testIssue;
    
    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setId(1L);
        owner.setName("Project Owner");
        
        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");
        testProject.setOwner(owner);
        
        testIssue = new Issue();
        testIssue.setId(1L);
        testIssue.setTitle("Test Issue");
        testIssue.setDescription("Test Description");
        testIssue.setStatus(IssueStatus.OPEN);
        testIssue.setPriority(IssuePriority.MEDIUM);
        testIssue.setProject(testProject);
    }
    
    @Test
    void testCreateIssue_Success() {
        // Given
        CreateIssueRequest request = new CreateIssueRequest();
        request.setTitle("New Issue");
        request.setDescription("Issue Description");
        request.setProjectId(1L);
        request.setStatus(IssueStatus.OPEN);
        request.setPriority(IssuePriority.HIGH);
        
        when(projectRepository.findById(1L)).thenReturn(Optional.of(testProject));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> {
            Issue i = invocation.getArgument(0);
            i.setId(1L);
            return i;
        });
        
        // When
        IssueDto result = issueService.createIssue(request);
        
        // Then
        assertNotNull(result);
        assertEquals("New Issue", result.getTitle());
        assertEquals(IssuePriority.HIGH, result.getPriority());
        verify(issueRepository, times(1)).save(any(Issue.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/issues"), any(IssueUpdateEvent.class));
    }
    
    @Test
    void testCreateIssue_ProjectNotFound() {
        // Given
        CreateIssueRequest request = new CreateIssueRequest();
        request.setTitle("New Issue");
        request.setProjectId(999L);
        
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(RuntimeException.class, () -> {
            issueService.createIssue(request);
        });
    }
    
    @Test
    void testGetIssueById_Success() {
        // Given
        when(issueRepository.findById(1L)).thenReturn(Optional.of(testIssue));
        
        // When
        IssueDto result = issueService.getIssueById(1L);
        
        // Then
        assertNotNull(result);
        assertEquals(testIssue.getId(), result.getId());
        assertEquals(testIssue.getTitle(), result.getTitle());
    }
    
    @Test
    void testUpdateIssue_Success() {
        // Given
        CreateIssueRequest request = new CreateIssueRequest();
        request.setTitle("Updated Issue");
        request.setDescription("Updated Description");
        request.setStatus(IssueStatus.IN_PROGRESS);
        request.setPriority(IssuePriority.HIGH);
        
        when(issueRepository.findById(1L)).thenReturn(Optional.of(testIssue));
        when(issueRepository.save(any(Issue.class))).thenReturn(testIssue);
        
        // When
        IssueDto result = issueService.updateIssue(1L, request);
        
        // Then
        assertNotNull(result);
        verify(issueRepository, times(1)).save(any(Issue.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/issues"), any(IssueUpdateEvent.class));
    }
}
