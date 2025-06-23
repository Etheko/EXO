package com.exo.repository;

import com.exo.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // Find courses by provider (e.g., Coursera, MIT)
    List<Course> findByProvider(String provider);

    // Find by platform if separate from provider (e.g., edX, Udemy)
    List<Course> findByPlatform(String platform);

    // Case-insensitive search on course title
    List<Course> findByTitleContainingIgnoreCase(String keyword);
}
