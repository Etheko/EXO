package com.exo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import javax.sql.rowset.serial.SerialBlob;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.sql.Blob;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "courses")
public class Course {

    /* ==========================
     *          FIELDS
     * ==========================
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // Course name

    @Column(nullable = false)
    private String provider; // Institution or organization (e.g., Coursera, MIT)

    private String platform; // Optional platform if different from provider

    private LocalDate startDate;

    private LocalDate completionDate;

    private Integer durationHours; // Approximate total hours of study

    @Column(length = 2000)
    private String description;

    // Topics/skills learned
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_topics", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "topic")
    private List<String> topics = new ArrayList<>();

    // Public URL to course details or certificate of completion
    private String courseUrl;

    // Optional certificate image if provided separately from Certificate entity
    @Column(name = "image_path")
    private String imagePath;

    @JsonIgnore
    @Lob
    private Blob imageBlob;

    // Optional relation to a dedicated Certificate entity when completion yields one
    @OneToOne(cascade = CascadeType.ALL)
    private Certificate certificate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ==========================
     *       CONSTRUCTORS
     * ==========================
     */

    public Course() {
    }

    public Course(String title, String provider, String platform, LocalDate startDate, LocalDate completionDate,
                  Integer durationHours, String description, List<String> topics, String courseUrl, String imagePath)
            throws IOException, SQLException {
        this.title = title;
        this.provider = provider;
        this.platform = platform;
        this.startDate = startDate;
        this.completionDate = completionDate;
        this.durationHours = durationHours;
        this.description = description;
        if (topics != null) this.topics = topics;
        this.courseUrl = courseUrl;
        this.imagePath = (imagePath == null || imagePath.isEmpty()) ? "/assets/defaultCourse.png" : imagePath;
        this.imageBlob = localImageToBlob(this.imagePath);
    }

    /* ==========================
     *       LIFECYCLE HOOKS
     * ==========================
     */

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /* ==========================
     *      HELPER METHODS
     * ==========================
     */

    public void addTopic(String topic) {
        this.topics.add(topic);
    }

    public Blob localImageToBlob(String imgPath) throws IOException, SQLException {
        // This path should start with a "/" to be read from the root of the classpath.
        // e.g., /static/assets/my-image.png
        String resourcePath = imgPath.replaceFirst("/assets", "/static/assets");
        if (!resourcePath.startsWith("/")) {
            resourcePath = "/" + resourcePath;
        }

        try (InputStream imgStream = getClass().getResourceAsStream(resourcePath)) {
            if (imgStream == null) {
                // If the primary path fails, try to load a default image as a fallback.
                try (InputStream defaultStream = getClass().getResourceAsStream("/static/assets/defaultCourseImage.png")) {
                    if (defaultStream == null) {
                        throw new IOException("Default course image not found at /static/assets/defaultCourseImage.png");
                    }
                    return new SerialBlob(defaultStream.readAllBytes());
                }
            }
            return new SerialBlob(imgStream.readAllBytes());
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Course course = (Course) o;
        return id.equals(course.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
