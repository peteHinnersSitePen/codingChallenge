package com.issuetracker.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @PostMapping("/drop-activity-logs")
    public String dropActivityLogsTable() {
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS activity_logs");
            return "Activity logs table dropped successfully. Please restart the backend to recreate it.";
        } catch (Exception e) {
            return "Error dropping table: " + e.getMessage();
        }
    }
}
