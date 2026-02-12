package com.issuetracker.repository;

import com.issuetracker.model.Comment;
import com.issuetracker.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.issue = :issue ORDER BY c.createdAt ASC")
    List<Comment> findByIssueOrderByCreatedAtAsc(@Param("issue") Issue issue);
    
    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.id = :id")
    Optional<Comment> findByIdWithAuthor(@Param("id") Long id);
}
