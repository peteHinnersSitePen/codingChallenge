package com.issuetracker.service;

import com.issuetracker.dto.ActivityLogDto;
import com.issuetracker.model.ActivityLog;
import com.issuetracker.model.ActivityType;
import com.issuetracker.model.Issue;
import com.issuetracker.model.User;
import com.issuetracker.repository.ActivityLogRepository;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private UserRepository userRepository;

    // SimpMessagingTemplate not mocked (Java 25 Byte Buddy limitation); set to null via reflection
    @InjectMocks
    private ActivityLogService activityLogService;

    private Issue testIssue;
    private User testUser;
    private ActivityLog testLog;

    @BeforeEach
    void setUp() throws Exception {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");

        testIssue = new Issue();
        testIssue.setId(1L);
        testIssue.setTitle("Test Issue");

        testLog = new ActivityLog();
        testLog.setId(1L);
        testLog.setActivityType(ActivityType.ISSUE_CREATED);
        testLog.setUser(testUser);
        testLog.setIssue(testIssue);
        testLog.setOldValue(null);
        testLog.setNewValue(null);
        testLog.setCreatedAt(LocalDateTime.now());

        // Set SimpMessagingTemplate to null (cannot mock in Java 25)
        Field messagingField = ActivityLogService.class.getDeclaredField("messagingTemplate");
        messagingField.setAccessible(true);
        messagingField.set(activityLogService, null);
    }

    @Test
    void getActivityLogsByIssueId_ReturnsLogs() {
        when(activityLogRepository.findByIssueIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(testLog));

        List<ActivityLogDto> result = activityLogService.getActivityLogsByIssueId(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(ActivityType.ISSUE_CREATED, result.get(0).getActivityType());
        assertEquals("Test User", result.get(0).getUserName());
        assertEquals(1L, result.get(0).getUserId());
        verify(activityLogRepository, times(1)).findByIssueIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void getActivityLogsByIssueId_EmptyList() {
        when(activityLogRepository.findByIssueIdOrderByCreatedAtDesc(2L))
                .thenReturn(List.of());

        List<ActivityLogDto> result = activityLogService.getActivityLogsByIssueId(2L);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(activityLogRepository, times(1)).findByIssueIdOrderByCreatedAtDesc(2L);
    }
}
