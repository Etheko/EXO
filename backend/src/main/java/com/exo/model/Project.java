package com.exo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "projects")
public class Project {

    /*
     * JsonView interfaces to control serialization scopes
     */
    public interface BasicInfo {
    }

    public interface GalleryInfo extends BasicInfo {
    }

    public interface SocialInfo extends BasicInfo {
    }

    /* ==========================
     *        CORE FIELDS
     * ==========================
     */

    @JsonView(BasicInfo.class)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonView(BasicInfo.class)
    @Column(nullable = false)
    private String title;

    @JsonView(BasicInfo.class)
    @Column(nullable = false, length = 1000)
    private String description;

    /* ==========================
     *      HEADER PICTURE
     * ==========================
     */

    @Setter
    @JsonIgnore
    @Lob
    private Blob headerPicture;

    @JsonView(BasicInfo.class)
    private String headerPictureString; // Resource path for quick access

    /* ==========================
     *          GALLERY
     * ==========================
     */

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "project_gallery", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "image_blob")
    @Lob
    @JsonIgnore // Blobs are heavy; expose paths separately via DTO if needed
    private List<Blob> gallery = new ArrayList<>();

    /* ==========================
     *      TECHNOLOGIES
     * ==========================
     */

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_technologies", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "technology")
    @JsonView(BasicInfo.class)
    private List<String> technologies = new ArrayList<>();

    /* ==========================
     *        PROJECT LINKS
     * ==========================
     */

    @JsonView(SocialInfo.class)
    private String liveDemoUrl;

    @JsonView(SocialInfo.class)
    private String projectWebsiteUrl;

    /* ==========================
     *        SOCIAL LINKS
     * ==========================
     */

    @JsonView(SocialInfo.class)
    private String github;

    @JsonView(SocialInfo.class)
    private String instagram;

    @JsonView(SocialInfo.class)
    private String facebook;

    @JsonView(SocialInfo.class)
    private String xUsername; // Formerly Twitter

    @JsonView(SocialInfo.class)
    private String mastodon;

    @JsonView(SocialInfo.class)
    private String bluesky;

    @JsonView(SocialInfo.class)
    private String tiktok;

    /* ==========================
     *        TIMESTAMPS
     * ==========================
     */

    @JsonView(BasicInfo.class)
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonView(BasicInfo.class)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* ==========================
     *         CONSTRUCTORS
     * ==========================
     */

    public Project() {
    }

    public Project(String title, String description, String headerPicturePath,
                   List<String> technologies, String liveDemoUrl, String projectWebsiteUrl,
                   String github, String instagram, String facebook, String xUsername,
                   String mastodon, String bluesky, String tiktok) throws IOException, SQLException {
        this.title = title;
        this.description = description;
        this.technologies = technologies != null ? technologies : new ArrayList<>();
        this.liveDemoUrl = liveDemoUrl;
        this.projectWebsiteUrl = projectWebsiteUrl;
        this.github = buildGithubUrl(github);
        this.instagram = buildInstagramUrl(instagram);
        this.facebook = buildFacebookUrl(facebook);
        this.xUsername = buildXUrl(xUsername);
        this.mastodon = buildMastodonUrl(mastodon);
        this.bluesky = buildBlueskyUrl(bluesky);
        this.tiktok = buildTiktokUrl(tiktok);

        if (headerPicturePath == null || headerPicturePath.isEmpty()) {
            this.headerPictureString = "/assets/defaultProjectPicture.png";
        } else {
            this.headerPictureString = headerPicturePath;
        }
        this.headerPicture = localImageToBlob(this.headerPictureString);
    }

    /* ==========================
     *      URL BUILDERS
     * ==========================
     */

    private String buildGithubUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        if (username.startsWith("https://github.com/")) {
            return username;
        }
        return "https://github.com/" + username;
    }

    private String buildInstagramUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        if (username.startsWith("https://instagram.com/")) {
            return username;
        }
        return "https://instagram.com/" + username;
    }

    private String buildFacebookUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("https://facebook.com/")) {
            return username;
        }
        return "https://facebook.com/" + username;
    }

    private String buildXUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        if (username.startsWith("https://x.com/") || username.startsWith("https://twitter.com/")) {
            return username;
        }
        return "https://x.com/" + username;
    }

    private String buildMastodonUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("https://")) {
            return username;
        }
        if (username.contains("@")) {
            String[] parts = username.split("@");
            if (parts.length == 2) {
                return "https://" + parts[1] + "/@" + parts[0];
            }
        }
        return "https://mastodon.social/@" + username;
    }

    private String buildBlueskyUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        if (username.startsWith("https://bsky.app/")) {
            return username;
        }
        return "https://bsky.app/profile/" + username;
    }

    private String buildTiktokUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        if (username.startsWith("https://tiktok.com/@")) {
            return username;
        }
        return "https://tiktok.com/@" + username;
    }

    /* ==========================
     *        HELPER METHODS
     * ==========================
     */

    public void addGalleryImage(String imgPath) throws IOException, SQLException {
        this.gallery.add(localImageToBlob(imgPath));
    }

    public void removeGalleryImage(int index) {
        if (index >= 0 && index < this.gallery.size()) {
            this.gallery.remove(index);
        }
    }

    public void addTechnology(String technology) {
        if (technology != null && !technology.trim().isEmpty()) {
            this.technologies.add(technology.trim());
        }
    }

    public void removeTechnology(String technology) {
        this.technologies.remove(technology);
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
                // Note: You might want a different default for projects vs. users.
                try (InputStream defaultStream = getClass().getResourceAsStream("/static/assets/defaultProjectHeader.png")) {
                    if (defaultStream == null) {
                        throw new IOException("Default project image not found at /static/assets/defaultProjectHeader.png");
                    }
                    return new SerialBlob(defaultStream.readAllBytes());
                }
            }
            return new SerialBlob(imgStream.readAllBytes());
        }
    }

    @Override
    public String toString() {
        return this.title;
    }

    /* ==========================
     *      JPA CALLBACKS
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
} 