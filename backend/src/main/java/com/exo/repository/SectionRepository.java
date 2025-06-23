package com.exo.repository;

import com.exo.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

    // Find section by slug
    Section findBySlug(String slug);

    // Get all published sections ordered by display order
    List<Section> findByPublishedTrueOrderByDisplayOrderAsc();
}
