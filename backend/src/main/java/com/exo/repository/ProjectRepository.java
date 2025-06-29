package com.exo.repository;

import com.exo.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    // Find projects by title containing the given string (case-insensitive)
    Page<Project> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    boolean existsByTitleIgnoreCase(String title);
    
    // Find projects by description containing the given string (case-insensitive)
    Page<Project> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);
    
    // Find projects that use a specific technology
    @Query("SELECT p FROM Project p JOIN p.technologies t WHERE LOWER(t) = LOWER(:technology)")
    Page<Project> findByTechnology(@Param("technology") String technology, Pageable pageable);
    
    // Find projects that use any of the given technologies
    @Query("SELECT p FROM Project p JOIN p.technologies t WHERE LOWER(t) IN :technologies")
    Page<Project> findByTechnologiesIn(@Param("technologies") List<String> technologies, Pageable pageable);
    
    // Search projects by title or description (case-insensitive)
    @Query("SELECT p FROM Project p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Project> searchProjects(@Param("query") String query, Pageable pageable);
    
    // Find projects created after a specific date
    Page<Project> findByCreatedAtAfter(java.time.LocalDateTime date, Pageable pageable);
    
    // Find projects created between two dates
    Page<Project> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable);
    
    // Find projects with live demo URL
    Page<Project> findByLiveDemoUrlIsNotNull(Pageable pageable);
    
    // Find projects with GitHub URL
    Page<Project> findByGithubIsNotNull(Pageable pageable);
    
    // Find projects by creation date (newest first)
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Find projects by title (alphabetical order)
    Page<Project> findAllByOrderByTitleAsc(Pageable pageable);
    
    // Count projects by technology
    @Query("SELECT t, COUNT(p) FROM Project p JOIN p.technologies t GROUP BY t ORDER BY COUNT(p) DESC")
    List<Object[]> countProjectsByTechnology();
    
    // Find projects with most technologies
    @Query("SELECT p FROM Project p ORDER BY SIZE(p.technologies) DESC")
    Page<Project> findProjectsByTechnologyCount(Pageable pageable);
} 