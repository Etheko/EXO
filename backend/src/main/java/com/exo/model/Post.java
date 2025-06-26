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
@Table(name = "posts")
public class Post {

    /* ==========================
     *       JSON VIEWS
     * ==========================
     */
    public interface BasicInfo {
    }

    public interface ContentInfo extends BasicInfo {
    }

    /* ==========================
     *         FIELDS
     * ==========================
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonView(BasicInfo.class)
    private Long id;

    @Column(nullable = false)
    @JsonView(BasicInfo.class)
    private String title;

    // SEO-friendly unique slug (e.g., "/my-first-post")
    @Column(nullable = false, unique = true)
    @JsonView(BasicInfo.class)
    private String slug;

    // Short excerpt or summary
    @Column(length = 500)
    @JsonView(BasicInfo.class)
    private String excerpt;

    // Full Markdown/HTML content
    @Lob
    @Column(columnDefinition = "TEXT")
    @JsonView(ContentInfo.class)
    private String content;

    /* ========== COVER IMAGE ========== */
    @Column(name = "cover_image_path")
    @JsonView(BasicInfo.class)
    private String coverImagePath;

    @JsonIgnore
    @Lob
    private Blob coverImageBlob;

    /* ========== TAGS ========== */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag")
    @JsonView(BasicInfo.class)
    private List<String> tags = new ArrayList<>();

    /* ========== GALLERY ========== */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "post_gallery", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_blob")
    @Lob
    @JsonIgnore
    private List<Blob> gallery = new ArrayList<>();

    /* ========== METRICS ========== */
    @JsonView(BasicInfo.class)
    private int likes = 0;

    @JsonView(BasicInfo.class)
    private int views = 0;

    // Estimated reading time in minutes (can be calculated on save)
    @JsonView(BasicInfo.class)
    private int readingMinutes;

    /* ========== TIMESTAMPS ========== */
    @JsonView(BasicInfo.class)
    private LocalDateTime createdAt;

    @JsonView(BasicInfo.class)
    private LocalDateTime updatedAt;

    @JsonView(BasicInfo.class)
    private LocalDateTime publishedAt;

    @JsonView(BasicInfo.class)
    private boolean published = false;

    /* ========== RELATIONS ========== */
    @ManyToOne
    @JoinColumn(name = "author_username")
    @JsonView(BasicInfo.class)
    private User author;

    /* ==========================
     *       CONSTRUCTORS
     * ==========================
     */
    public Post() {
    }

    public Post(String title, String slug, String excerpt, String content, String coverImagePath,
                List<String> tags, boolean published, User author) throws IOException, SQLException {
        this.title = title;
        this.slug = slug;
        this.excerpt = excerpt;
        this.content = content;
        this.coverImagePath = (coverImagePath == null || coverImagePath.isEmpty()) ? "/assets/defaultPostCover.png" : coverImagePath;
        this.coverImageBlob = localImageToBlob(this.coverImagePath);
        if (tags != null) this.tags = tags;
        this.published = published;
        this.author = author;
        this.readingMinutes = estimateReadingMinutes(content);
    }

    /* ==========================
     *      LIFECYCLE HOOKS
     * ==========================
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (published && publishedAt == null) publishedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /* ==========================
     *      HELPER METHODS
     * ==========================
     */
    public void addTag(String tag) {
        this.tags.add(tag);
    }

    public void removeTag(String tag) {
        this.tags.remove(tag);
    }

    public void incrementViews() {
        this.views++;
    }

    public void incrementLikes() {
        this.likes++;
    }

    public void addGalleryImage(String imgPath) throws IOException, SQLException {
        this.gallery.add(localImageToBlob(imgPath));
    }

    public void removeGalleryImage(int index) {
        if (index >= 0 && index < this.gallery.size()) {
            this.gallery.remove(index);
        }
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
                try (InputStream defaultStream = getClass().getResourceAsStream("/static/assets/defaultPostCover.png")) {
                    if (defaultStream == null) {
                        throw new IOException("Default post image not found at /static/assets/defaultPostCover.png");
                    }
                    return new SerialBlob(defaultStream.readAllBytes());
                }
            }
            return new SerialBlob(imgStream.readAllBytes());
        }
    }

    private int estimateReadingMinutes(String text) {
        if (text == null || text.isBlank()) return 0;
        int words = text.trim().split("\\s+").length;
        return Math.max(1, words / 200); // Roughly 200 wpm
    }

    @Override
    public String toString() {
        return "Post{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", slug='" + slug + '\'' +
                ", excerpt='" + excerpt + '\'' +
                ", content='" + content + '\'' +
                ", coverImagePath='" + coverImagePath + '\'' +
                ", coverImageBlob=" + coverImageBlob +
                ", tags=" + tags +
                ", gallery=" + gallery +
                ", likes=" + likes +
                ", views=" + views +
                ", readingMinutes=" + readingMinutes +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", publishedAt=" + publishedAt +
                ", published=" + published +
                ", author=" + author +
                '}';
    }
}
