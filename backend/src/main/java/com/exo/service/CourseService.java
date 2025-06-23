package com.exo.service;

import com.exo.model.Course;
import com.exo.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public Course saveCourse(Course course) {
        return courseRepository.save(course);
    }

    public Optional<Course> findById(Long id) {
        return courseRepository.findById(id);
    }

    public List<Course> findAll() {
        return courseRepository.findAll();
    }

    public void deleteById(Long id) {
        courseRepository.deleteById(id);
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    public List<Course> findByProvider(String provider) {
        return courseRepository.findByProvider(provider);
    }

    public List<Course> findByPlatform(String platform) {
        return courseRepository.findByPlatform(platform);
    }

    public List<Course> searchByTitle(String keyword) {
        return courseRepository.findByTitleContainingIgnoreCase(keyword);
    }

    /* ==========================
     *      COURSE MANAGEMENT
     * ==========================
     */

    public Course createCourse(String title, String provider, String platform, LocalDate startDate,
                             LocalDate completionDate, Integer durationHours, String description,
                             List<String> topics, String courseUrl, String imagePath)
            throws IOException, SQLException {
        Course course = new Course(title, provider, platform, startDate, completionDate,
                                 durationHours, description, topics, courseUrl, imagePath);
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, String title, String provider, String platform,
                             LocalDate startDate, LocalDate completionDate, Integer durationHours,
                             String description, List<String> topics, String courseUrl, String imagePath)
            throws IOException, SQLException {
        Optional<Course> optional = courseRepository.findById(id);
        if (optional.isPresent()) {
            Course course = optional.get();
            course.setTitle(title);
            course.setProvider(provider);
            course.setPlatform(platform);
            course.setStartDate(startDate);
            course.setCompletionDate(completionDate);
            course.setDurationHours(durationHours);
            course.setDescription(description);
            if (topics != null) course.setTopics(topics);
            course.setCourseUrl(courseUrl);
            if (imagePath != null && !imagePath.isEmpty()) {
                course.setImagePath(imagePath);
                course.setImageBlob(course.localImageToBlob(imagePath));
            }
            return courseRepository.save(course);
        }
        return null;
    }

    /* ==========================
     *      TOPIC MANAGEMENT
     * ==========================
     */

    public Course addTopic(Long courseId, String topic) {
        Optional<Course> optional = courseRepository.findById(courseId);
        if (optional.isPresent()) {
            Course course = optional.get();
            course.addTopic(topic);
            return courseRepository.save(course);
        }
        return null;
    }

    public Course removeTopic(Long courseId, String topic) {
        Optional<Course> optional = courseRepository.findById(courseId);
        if (optional.isPresent()) {
            Course course = optional.get();
            course.getTopics().remove(topic);
            return courseRepository.save(course);
        }
        return null;
    }

    /* ==========================
     *      UTILITIES & ANALYTICS
     * ==========================
     */

    public List<Course> getCompletedCourses() {
        List<Course> allCourses = courseRepository.findAll();
        return allCourses.stream()
                .filter(course -> course.getCompletionDate() != null)
                .toList();
    }

    public List<Course> getInProgressCourses() {
        List<Course> allCourses = courseRepository.findAll();
        return allCourses.stream()
                .filter(course -> course.getStartDate() != null && course.getCompletionDate() == null)
                .toList();
    }

    public int getTotalStudyHours() {
        List<Course> allCourses = courseRepository.findAll();
        return allCourses.stream()
                .filter(course -> course.getDurationHours() != null)
                .mapToInt(Course::getDurationHours)
                .sum();
    }

    public List<Course> getCoursesByDurationRange(int minHours, int maxHours) {
        List<Course> allCourses = courseRepository.findAll();
        return allCourses.stream()
                .filter(course -> course.getDurationHours() != null &&
                                course.getDurationHours() >= minHours &&
                                course.getDurationHours() <= maxHours)
                .toList();
    }
}
