package com.issuetracker.controller;

import com.issuetracker.dto.ActivityLogDto;
import com.issuetracker.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/activities")
@CrossOrigin(origins = "http://localhost:4200")
public class ActivityLogController {
    
    @Autowired
    private ActivityLogService activityLogService;
    
    @GetMapping
    public ResponseEntity<List<ActivityLogDto>> getActivityLogs(@PathVariable Long issueId) {
        try {
            List<ActivityLogDto> logs = activityLogService.getActivityLogsByIssueId(issueId);
            return ResponseEntity.ok(logs);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
