package com.issuetracker.repository;

import com.issuetracker.model.Project;
import com.issuetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwner(User owner);
    
    @Query("SELECT p FROM Project p WHERE " +
           "(:searchText IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Project> findAllWithSearch(@Param("searchText") String searchText);
}
