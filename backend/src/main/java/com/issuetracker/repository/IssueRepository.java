package com.issuetracker.repository;

import com.issuetracker.model.Issue;
import com.issuetracker.model.IssuePriority;
import com.issuetracker.model.IssueStatus;
import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    
    Page<Issue> findByProject(Project project, Pageable pageable);
    
    Page<Issue> findByProjectAndStatus(Project project, IssueStatus status, Pageable pageable);
    
    Page<Issue> findByProjectAndPriority(Project project, IssuePriority priority, Pageable pageable);
    
    Page<Issue> findByProjectAndAssignee(Project project, User assignee, Pageable pageable);
    
    @Query("SELECT i FROM Issue i WHERE i.project = :project " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:priority IS NULL OR i.priority = :priority) " +
           "AND (:assigneeId IS NULL OR i.assignee.id = :assigneeId) " +
           "AND (:searchText IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    Page<Issue> findWithFilters(
        @Param("project") Project project,
        @Param("status") IssueStatus status,
        @Param("priority") IssuePriority priority,
        @Param("assigneeId") Long assigneeId,
        @Param("searchText") String searchText,
        Pageable pageable
    );
    
    @Query("SELECT i FROM Issue i WHERE " +
           "(:status IS NULL OR i.status = :status) " +
           "AND (:priority IS NULL OR i.priority = :priority) " +
           "AND (:assigneeId IS NULL OR i.assignee.id = :assigneeId) " +
           "AND (:projectId IS NULL OR i.project.id = :projectId) " +
           "AND (:searchText IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    Page<Issue> findAllWithFilters(
        @Param("status") IssueStatus status,
        @Param("priority") IssuePriority priority,
        @Param("assigneeId") Long assigneeId,
        @Param("projectId") Long projectId,
        @Param("searchText") String searchText,
        Pageable pageable
    );
}
