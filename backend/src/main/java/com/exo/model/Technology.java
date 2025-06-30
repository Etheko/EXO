package com.exo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Blob;
import java.sql.SQLException;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "technologies")
@NoArgsConstructor
public class Technology {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    private String link;

    @JsonIgnore
    @Lob
    private Blob icon;

    private String iconString;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Technology(String name, String description, String link, String iconPath) throws IOException, SQLException {
        this.name = name;
        this.description = description;
        this.link = link;
        if (iconPath == null || iconPath.isEmpty()) {
            this.iconString = "/assets/defaultProjectIcon.png"; // A default icon
        } else {
            this.iconString = iconPath;
        }
        this.icon = localImageToBlob(this.iconString);
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
                // Fallback to a default image. A more specific default could be created.
                try (InputStream defaultStream = getClass().getResourceAsStream("/static/assets/defaultProjectIcon.png")) {
                    if (defaultStream == null) {
                        throw new IOException("Default technology icon not found at /static/assets/defaultProjectIcon.png");
                    }
                    return new SerialBlob(defaultStream.readAllBytes());
                }
            }
            return new SerialBlob(imgStream.readAllBytes());
        }
    }

    public Blob localImageToBlob(String imgPath, String fallbackPath) throws IOException, SQLException {
        if (imgPath == null || imgPath.trim().isEmpty()) {
            imgPath = fallbackPath;
        }
        return localImageToBlob(imgPath);
    }

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
