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
@Table(name = "cvs")
public class CV {

    /* ==========================
     *          FIELDS
     * ==========================
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Optional title or label (e.g., "Software Engineer CV")
    private String title;

    // Original filename or relative path stored for quick reference
    @Column(name = "file_path")
    private String filePath;

    // PDF file stored as a blob for convenient database storage
    @JsonIgnore
    @Lob
    private Blob pdfBlob;

    // Date the CV was uploaded
    private LocalDate uploadedDate = LocalDate.now();

    // Download/view URL if file is also served statically
    private String fileUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ==========================
     *       CONSTRUCTORS
     * ==========================
     */

    public CV() {
    }

    public CV(String title, String filePath, String fileUrl) throws IOException, SQLException {
        this.title = title;
        this.filePath = (filePath == null || filePath.isEmpty()) ? "/assets/defaultCV.pdf" : filePath;
        this.fileUrl = fileUrl;
        this.pdfBlob = localFileToBlob(this.filePath);
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

    public Blob localFileToBlob(String pdfPath) throws IOException, SQLException {
        pdfPath = pdfPath.replace("/assets", "backend/src/main/resources/static/assets");
        String onDocker = System.getenv("RUNNING_IN_DOCKER");
        Blob fileBlob;

        if (onDocker != null && onDocker.equals("true")) {
            try (InputStream fileStream = getClass()
                    .getResourceAsStream(pdfPath.replace("backend/src/main/resources/static", "/static"))) {
                if (fileStream == null) {
                    throw new IOException("PDF not found");
                }
                fileBlob = new SerialBlob(fileStream.readAllBytes());
            }
        } else {
            String baseDir = System.getProperty("user.dir").replace("\\", "/").replace("/backend", "");
            File pdfFile = new File(baseDir + "/" + pdfPath);
            if (!pdfFile.exists() || !pdfFile.canRead()) {
                throw new IOException("Cannot access PDF file: " + pdfFile.getAbsolutePath());
            }
            fileBlob = new SerialBlob(Files.readAllBytes(pdfFile.toPath()));
        }
        return fileBlob;
    }
}
