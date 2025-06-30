package com.exo.repository;

import com.exo.model.Technology;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TechnologyRepository extends JpaRepository<Technology, Long> {
    Optional<Technology> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    Page<Technology> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
