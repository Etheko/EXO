package com.exo.controller;

import com.exo.model.Course;
import com.exo.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@Tag(name = "Course Management", description = "APIs for managing courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @GetMapping
    @Operation(summary = "Get all courses", description = "Retrieve a list of all courses")
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID", description = "Retrieve a specific course by its ID")
    public ResponseEntity<Course> getCourseById(
            @Parameter(description = "Course ID") @PathVariable Long id) {
        return courseService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new course", description = "Create a new course (Admin only)")
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        try {
            return ResponseEntity.ok(courseService.saveCourse(course));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update course", description = "Update an existing course (Admin only)")
    public ResponseEntity<Course> updateCourse(
            @Parameter(description = "Course ID") @PathVariable Long id,
            @RequestBody Course course) {
        return courseService.findById(id)
                .map(existingCourse -> {
                    course.setId(id);
                    try {
                        return ResponseEntity.ok(courseService.saveCourse(course));
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().<Course>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete course", description = "Delete a course by ID (Admin only)")
    public ResponseEntity<Void> deleteCourse(
            @Parameter(description = "Course ID") @PathVariable Long id) {
        return courseService.findById(id)
                .map(course -> {
                    courseService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    @GetMapping("/provider/{provider}")
    @Operation(summary = "Get courses by provider", description = "Find courses from a specific provider/organization")
    public ResponseEntity<List<Course>> getCoursesByProvider(
            @Parameter(description = "Course provider") @PathVariable String provider) {
        return ResponseEntity.ok(courseService.findByProvider(provider));
    }

    @GetMapping("/platform/{platform}")
    @Operation(summary = "Get courses by platform", description = "Find courses from a specific platform")
    public ResponseEntity<List<Course>> getCoursesByPlatform(
            @Parameter(description = "Course platform") @PathVariable String platform) {
        return ResponseEntity.ok(courseService.findByPlatform(platform));
    }

    @GetMapping("/search")
    @Operation(summary = "Search courses by title", description = "Search courses by title keyword")
    public ResponseEntity<List<Course>> searchCoursesByTitle(
            @Parameter(description = "Search keyword") @RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchByTitle(keyword));
    }

    /* ==========================
     *      COURSE MANAGEMENT
     * ==========================
     */

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create course with details", description = "Create a new course with all details (Admin only)")
    public ResponseEntity<Course> createCourseWithDetails(
            @Parameter(description = "Course title") @RequestParam String title,
            @Parameter(description = "Course provider") @RequestParam String provider,
            @Parameter(description = "Course platform") @RequestParam(required = false) String platform,
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam(required = false) String startDate,
            @Parameter(description = "Completion date (YYYY-MM-DD)") @RequestParam(required = false) String completionDate,
            @Parameter(description = "Duration in hours") @RequestParam(required = false) Integer durationHours,
            @Parameter(description = "Course description") @RequestParam(required = false) String description,
            @Parameter(description = "Course URL") @RequestParam(required = false) String courseUrl,
            @Parameter(description = "Image path") @RequestParam(required = false) String imagePath,
            @Parameter(description = "Topics (comma-separated)") @RequestParam(required = false) String topics) {
        try {
            LocalDate parsedStartDate = startDate != null ? LocalDate.parse(startDate) : null;
            LocalDate parsedCompletionDate = completionDate != null ? LocalDate.parse(completionDate) : null;
            
            List<String> topicsList = null;
            if (topics != null && !topics.isEmpty()) {
                topicsList = List.of(topics.split(","));
            }
            
            Course course = courseService.createCourse(
                    title, provider, platform, parsedStartDate, parsedCompletionDate,
                    durationHours, description, topicsList, courseUrl, imagePath);
            return ResponseEntity.ok(course);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update course with details", description = "Update an existing course with all details (Admin only)")
    public ResponseEntity<Course> updateCourseWithDetails(
            @Parameter(description = "Course ID") @PathVariable Long id,
            @Parameter(description = "Course title") @RequestParam String title,
            @Parameter(description = "Course provider") @RequestParam String provider,
            @Parameter(description = "Course platform") @RequestParam(required = false) String platform,
            @Parameter(description = "Start date (YYYY-MM-DD)") @RequestParam(required = false) String startDate,
            @Parameter(description = "Completion date (YYYY-MM-DD)") @RequestParam(required = false) String completionDate,
            @Parameter(description = "Duration in hours") @RequestParam(required = false) Integer durationHours,
            @Parameter(description = "Course description") @RequestParam(required = false) String description,
            @Parameter(description = "Course URL") @RequestParam(required = false) String courseUrl,
            @Parameter(description = "Image path") @RequestParam(required = false) String imagePath,
            @Parameter(description = "Topics (comma-separated)") @RequestParam(required = false) String topics) {
        try {
            LocalDate parsedStartDate = startDate != null ? LocalDate.parse(startDate) : null;
            LocalDate parsedCompletionDate = completionDate != null ? LocalDate.parse(completionDate) : null;
            
            List<String> topicsList = null;
            if (topics != null && !topics.isEmpty()) {
                topicsList = List.of(topics.split(","));
            }
            
            Course course = courseService.updateCourse(
                    id, title, provider, platform, parsedStartDate, parsedCompletionDate,
                    durationHours, description, topicsList, courseUrl, imagePath);
            return course != null ? ResponseEntity.ok(course) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *      TOPIC MANAGEMENT
     * ==========================
     */

    @PostMapping("/{id}/topics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add topic to course", description = "Add a new topic/skill to a course (Admin only)")
    public ResponseEntity<Course> addTopic(
            @Parameter(description = "Course ID") @PathVariable Long id,
            @Parameter(description = "Topic to add") @RequestParam String topic) {
        Course course = courseService.addTopic(id, topic);
        return course != null ? ResponseEntity.ok(course) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}/topics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove topic from course", description = "Remove a topic/skill from a course (Admin only)")
    public ResponseEntity<Course> removeTopic(
            @Parameter(description = "Course ID") @PathVariable Long id,
            @Parameter(description = "Topic to remove") @RequestParam String topic) {
        Course course = courseService.removeTopic(id, topic);
        return course != null ? ResponseEntity.ok(course) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      ANALYTICS & UTILITIES
     * ==========================
     */

    @GetMapping("/completed")
    @Operation(summary = "Get completed courses", description = "Retrieve all completed courses")
    public ResponseEntity<List<Course>> getCompletedCourses() {
        return ResponseEntity.ok(courseService.getCompletedCourses());
    }

    @GetMapping("/in-progress")
    @Operation(summary = "Get in-progress courses", description = "Retrieve all courses currently in progress")
    public ResponseEntity<List<Course>> getInProgressCourses() {
        return ResponseEntity.ok(courseService.getInProgressCourses());
    }

    @GetMapping("/total-hours")
    @Operation(summary = "Get total study hours", description = "Calculate total hours across all courses")
    public ResponseEntity<Integer> getTotalStudyHours() {
        return ResponseEntity.ok(courseService.getTotalStudyHours());
    }

    @GetMapping("/duration-range")
    @Operation(summary = "Get courses by duration range", description = "Find courses within a specific duration range")
    public ResponseEntity<List<Course>> getCoursesByDurationRange(
            @Parameter(description = "Minimum hours") @RequestParam int minHours,
            @Parameter(description = "Maximum hours") @RequestParam int maxHours) {
        return ResponseEntity.ok(courseService.getCoursesByDurationRange(minHours, maxHours));
    }
}
