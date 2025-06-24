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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
public class User {

    /*
     * JsonView interfaces to control serialization scopes
     */
    public interface UsernameInfo {
    }

    public interface BasicInfo extends UsernameInfo {
    }

    public interface SocialInfo extends BasicInfo {
    }

    public interface GalleryInfo extends BasicInfo {
    }

    /* ==========================
     *        CORE FIELDS
     * ==========================
     */

    @JsonView(UsernameInfo.class)
    @Id
    private String username;

    @JsonIgnore
    private String password;

    @JsonView(BasicInfo.class)
    private String nick; // Alias

    @JsonView(BasicInfo.class)
    private String email;

    /* ==========================
     *    PERSONAL INFORMATION
     * ==========================
     */

    @JsonView(BasicInfo.class)
    private String realName;

    @JsonView(BasicInfo.class)
    private String firstSurname;

    @JsonView(BasicInfo.class)
    private String secondSurname;

    @JsonView(BasicInfo.class)
    private LocalDate dateOfBirth;

    /* ==========================
     *      PROFILE PICTURE
     * ==========================
     */

    @Setter
    @JsonIgnore
    @Lob
    private Blob pfp;

    @JsonView(BasicInfo.class)
    private String pfpString; // Resource path for quick access

    /* ==========================
     *          GALLERY
     * ==========================
     */

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_gallery", joinColumns = @JoinColumn(name = "username"))
    @Column(name = "image_blob")
    @Lob
    @JsonIgnore // Blobs are heavy; expose paths separately via DTO if needed
    private List<Blob> gallery = new ArrayList<>();

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

    @JsonView(SocialInfo.class)
    private String linkedIn;

    /* ==========================
     *        RELATIONS
     * ==========================
     */

    // One user can showcase many projects
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Project> projects = new ArrayList<>();

    // Certificates & Courses
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certificate> certificates = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Course> courses = new ArrayList<>();

    // Single CV reference
    @OneToOne(cascade = CascadeType.ALL)
    private CV cv;

    /* ==========================
     *     PERSONALITY DETAILS
     * ==========================
     */

    @JsonView(BasicInfo.class)
    private String distinctivePhrase;

    @JsonView(BasicInfo.class)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_likes", joinColumns = @JoinColumn(name = "username"))
    @Column(name = "like_value")
    @JsonView(BasicInfo.class)
    private List<String> likes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_dislikes", joinColumns = @JoinColumn(name = "username"))
    @Column(name = "dislike_value")
    @JsonView(BasicInfo.class)
    private List<String> dislikes = new ArrayList<>();

    /* ==========================
     *        TIMESTAMPS
     * ==========================
     */

    @JsonView(BasicInfo.class)
    private LocalDate creationDate = LocalDate.now();

    @JsonView(BasicInfo.class)
    private LocalTime creationTime = LocalTime.now();

    @JsonView(BasicInfo.class)
    private LocalDateTime fullCreationDate = LocalDateTime.of(creationDate, creationTime);

    /* ==========================
     *         CONSTRUCTORS
     * ==========================
     */

    public User() {
    }

    public User(String username, String password, String nick, String email, String pfpPath,
                String realName, String firstSurname, String secondSurname, LocalDate dateOfBirth,
                String github, String instagram, String facebook, String xUsername, String mastodon, 
                String bluesky, String tiktok, String linkedIn,
                String distinctivePhrase, String description) throws IOException, SQLException {
        this.username = username;
        this.password = password;
        this.nick = nick;
        this.email = email;
        this.realName = realName;
        this.firstSurname = firstSurname;
        this.secondSurname = secondSurname;
        this.dateOfBirth = dateOfBirth;
        this.github = buildGithubUrl(github);
        this.instagram = buildInstagramUrl(instagram);
        this.facebook = buildFacebookUrl(facebook);
        this.xUsername = buildXUrl(xUsername);
        this.mastodon = buildMastodonUrl(mastodon);
        this.bluesky = buildBlueskyUrl(bluesky);
        this.tiktok = buildTiktokUrl(tiktok);
        this.linkedIn = buildLinkedInUrl(linkedIn);
        this.distinctivePhrase = distinctivePhrase;
        this.description = description;

        if (pfpPath == null || pfpPath.isEmpty()) {
            this.pfpString = "/assets/defaultProfilePicture.png";
        } else {
            this.pfpString = pfpPath;
        }
        this.pfp = localImageToBlob(this.pfpString);
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

    private String buildLinkedInUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        if (username.startsWith("https://linkedin.com/") || username.startsWith("https://www.linkedin.com/")) {
            return username;
        }
        if (username.matches("^[a-zA-Z0-9_-]+$")) {
            return "https://linkedin.com/in/" + username;
        }
        return "https://linkedin.com/in/" + username.toLowerCase().replaceAll("\\s+", "-");
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

    public void addProject(Project project) {
        this.projects.add(project);
    }

    public void addCertificate(Certificate certificate) {
        this.certificates.add(certificate);
    }

    public void addCourse(Course course) {
        this.courses.add(course);
    }

    public void addLike(String like) {
        this.likes.add(like);
    }

    public void addDislike(String dislike) {
        this.dislikes.add(dislike);
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

    @Override
    public String toString() {
        return this.username;
    }
}
