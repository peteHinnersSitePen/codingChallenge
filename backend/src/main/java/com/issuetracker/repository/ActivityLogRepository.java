package com.issuetracker.repository;

import com.issuetracker.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    @Query("SELECT a FROM ActivityLog a " +
           "LEFT JOIN FETCH a.user " +
           "WHERE a.issue.id = :issueId " +
           "ORDER BY a.createdAt DESC")
    List<ActivityLog> findByIssueIdOrderByCreatedAtDesc(@Param("issueId") Long issueId);
}
