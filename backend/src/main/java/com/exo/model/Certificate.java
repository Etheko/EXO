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
