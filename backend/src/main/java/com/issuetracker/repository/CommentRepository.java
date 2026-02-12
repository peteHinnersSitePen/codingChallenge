package com.issuetracker.repository;

import com.issuetracker.model.Comment;
import com.issuetracker.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueOrderByCreatedAtAsc(Issue issue);
}
