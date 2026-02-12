package com.issuetracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.issuetracker.dto.AuthRequest;
import com.issuetracker.dto.AuthResponse;
import com.issuetracker.dto.CreateProjectRequest;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
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
class ProjectControllerIntegrationTest {
    
    @Autowired
    private WebApplicationContext context;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
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
        
        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser = userRepository.save(testUser);
        
        // Login to get auth token
        AuthRequest loginRequest = new AuthRequest("test@example.com", "password123");
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
    void testCreateProject_Authenticated() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Test Project");
        
        mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Test Project"))
            .andExpect(jsonPath("$.ownerId").value(testUser.getId()));
    }
    
    @Test
    void testCreateProject_Unauthenticated() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("Test Project");
        
        mockMvc.perform(post("/api/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    void testGetAllProjects() throws Exception {
        // Create a project
        Project project = new Project();
        project.setName("Existing Project");
        project.setOwner(testUser);
        projectRepository.save(project);
        
        mockMvc.perform(get("/api/projects")
                .header("Authorization", "Bearer " + authToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
    
    @Test
    void testGetProjectById() throws Exception {
        // Create a project
        Project project = new Project();
        project.setName("Test Project");
        project.setOwner(testUser);
        project = projectRepository.save(project);
        
        mockMvc.perform(get("/api/projects/" + project.getId())
                .header("Authorization", "Bearer " + authToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(project.getId()))
            .andExpect(jsonPath("$.name").value("Test Project"));
    }
}
