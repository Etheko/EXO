package com.exo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "sections")
@Getter @Setter
public class Section {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;        // "cyber-logs"

    @Column(nullable = false)
    private String title;       // "SYS_SEC::INSIGHTS"

    @Column(length = 500)
    private String description; // brief tagline

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;     // full HTML/Markdown

    private Integer displayOrder = 0;
    private Boolean published = true;

    @Column(name = "component_type")
    private String componentType; // "projects", "blog", "about", "tech-stack", etc.

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
