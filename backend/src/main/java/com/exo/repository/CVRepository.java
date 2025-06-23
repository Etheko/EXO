package com.exo.repository;

import com.exo.model.CV;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CVRepository extends JpaRepository<CV, Long> {

    // Get the latest uploaded CV (by uploadedDate desc)
    CV findTopByOrderByUploadedDateDesc();
}
