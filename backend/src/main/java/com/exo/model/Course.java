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
        imgPath = imgPath.replace("/assets", "backend/src/main/resources/static/assets");
        String onDocker = System.getenv("RUNNING_IN_DOCKER");
        Blob imgBlob;

        if (onDocker != null && onDocker.equals("true")) {
            try (InputStream imgStream = getClass()
                    .getResourceAsStream(imgPath.replace("backend/src/main/resources/static", "/static"))) {
                if (imgStream == null) {
                    throw new IOException("Image not found");
                }
                imgBlob = new SerialBlob(imgStream.readAllBytes());
            }
        } else {
            String baseDir = System.getProperty("user.dir").replace("\\", "/").replace("/backend", "");
            File imgFile = new File(baseDir + "/" + imgPath);
            if (!imgFile.exists() || !imgFile.canRead()) {
                throw new IOException("Cannot access image file: " + imgFile.getAbsolutePath());
            }
            imgBlob = new SerialBlob(Files.readAllBytes(imgFile.toPath()));
        }
        return imgBlob;
    }
}
