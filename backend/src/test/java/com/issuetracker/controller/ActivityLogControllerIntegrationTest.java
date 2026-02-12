package com.issuetracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.issuetracker.dto.AuthRequest;
import com.issuetracker.dto.AuthResponse;
import com.issuetracker.dto.CreateIssueRequest;
import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.model.ActivityLog;
import com.issuetracker.model.ActivityType;
import com.issuetracker.model.Issue;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import com.issuetracker.repository.ActivityLogRepository;
import com.issuetracker.repository.IssueRepository;
import com.issuetracker.repository.ProjectRepository;
import com.issuetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class ActivityLogControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private String authToken;
    private User testUser;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        testUser = new User();
        testUser.setEmail("activitytest@example.com");
        testUser.setName("Activity Test User");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser = userRepository.save(testUser);

        AuthRequest loginRequest = new AuthRequest("activitytest@example.com", "password123");
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        AuthResponse authResponse = objectMapper.readValue(loginResponse, AuthResponse.class);
        authToken = authResponse.getToken();
    }

    @Test
    void getActivityLogs_ReturnsActivitiesForIssue() throws Exception {
        // Create project and issue in DB (so we have an issue to attach activity to)
        Project project = new Project();
        project.setName("Activity Test Project");
        project.setOwner(testUser);
        project = projectRepository.save(project);

        Issue issue = new Issue();
        issue.setTitle("Test Issue");
        issue.setDescription("Description");
        issue.setProject(project);
        issue.setCreator(testUser);
        issue = issueRepository.save(issue);

        // Persist an activity log directly (API + DB test)
        ActivityLog log = new ActivityLog();
        log.setIssue(issue);
        log.setUser(testUser);
        log.setActivityType(ActivityType.ISSUE_CREATED);
        log.setOldValue(null);
        log.setNewValue(null);
        activityLogRepository.save(log);

        // GET activity logs via API
        mockMvc.perform(get("/api/issues/" + issue.getId() + "/activities")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].activityType").value("ISSUE_CREATED"))
                .andExpect(jsonPath("$[0].userName").value("Activity Test User"));
    }

    @Test
    void getActivityLogs_EmptyList_ReturnsEmptyArray() throws Exception {
        // Create project and issue so we have a valid issue ID
        Project project = new Project();
        project.setName("Empty Activity Project");
        project.setOwner(testUser);
        project = projectRepository.save(project);
        Issue issue = new Issue();
        issue.setTitle("Issue With No Activity");
        issue.setProject(project);
        issue.setCreator(testUser);
        issue = issueRepository.save(issue);

        mockMvc.perform(get("/api/issues/" + issue.getId() + "/activities")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getActivityLogs_Unauthenticated_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/issues/1/activities"))
                .andExpect(status().isForbidden());
    }
}
