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
import java.util.Objects;

@Setter
@Getter
@Entity
@Table(name = "certificates")
public class Certificate {

    /* ==========================
     *          FIELDS
     * ==========================
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // Certificate name

    @Column(nullable = false)
    private String issuer; // Organization issuing the certificate

    private LocalDate issueDate;

    private LocalDate expirationDate; // Optional, null if does not expire

    private String credentialId; // Optional identifier provided by issuer

    private String credentialUrl; // Publicly accessible URL to verify certificate

    @Column(length = 2000)
    private String description;

    @Column(name = "image_path")
    private String imagePath; // Relative path to certificate image

    @JsonIgnore
    @Lob
    private Blob imageBlob; // Stored blob of the certificate image

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ==========================
     *       CONSTRUCTORS
     * ==========================
     */

    public Certificate() {
    }

    public Certificate(String title, String issuer, LocalDate issueDate, LocalDate expirationDate,
                        String credentialId, String credentialUrl, String description, String imagePath)
            throws IOException, SQLException {
        this.title = title;
        this.issuer = issuer;
        this.issueDate = issueDate;
        this.expirationDate = expirationDate;
        this.credentialId = credentialId;
        this.credentialUrl = credentialUrl;
        this.description = description;
        this.imagePath = (imagePath == null || imagePath.isEmpty()) ? "/assets/defaultCertificate.png" : imagePath;
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
                try (InputStream defaultStream = getClass().getResourceAsStream("/static/assets/defaultCertificateImage.png")) {
                    if (defaultStream == null) {
                        throw new IOException("Default certificate image not found at /static/assets/defaultCertificateImage.png");
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
        Certificate that = (Certificate) o;
        return id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
