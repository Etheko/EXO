package com.exo.service;

import com.exo.model.User;
import com.exo.model.Project;
import com.exo.model.Certificate;
import com.exo.model.Course;
import com.exo.model.CV;
import com.exo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import com.exo.dto.UpdateUserBasicInfoDTO;
import com.exo.dto.UpdateUserSocialLinksDTO;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(userRepository.findByUsername(username));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public void deleteUser(String username) {
        userRepository.deleteById(username);
    }

    /* ==========================
     *      VALIDATION
     * ==========================
     */

    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsername(username) == null;
    }

    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email) == null;
    }

    /* ==========================
     *      PROFILE MANAGEMENT
     * ==========================
     */

    public User uploadProfilePicture(String username, MultipartFile file) throws IOException, SQLException {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setPfp(new javax.sql.rowset.serial.SerialBlob(file.getBytes()));
            user.setPfpString("/api/users/" + username + "/pfp");
            return userRepository.save(user);
        }
        return null;
    }

    public User updateProfilePicture(String username, String imagePath) throws IOException, SQLException {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setPfpString(imagePath);
            user.setPfp(user.localImageToBlob(imagePath));
            return userRepository.save(user);
        }
        return null;
    }

    public User updateBasicInfo(String username, UpdateUserBasicInfoDTO dto) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            if (dto.getRealName() != null) user.setRealName(dto.getRealName());
            if (dto.getFirstSurname() != null) user.setFirstSurname(dto.getFirstSurname());
            if (dto.getSecondSurname() != null) user.setSecondSurname(dto.getSecondSurname());
            if (dto.getNick() != null) user.setNick(dto.getNick());
            if (dto.getEmail() != null) user.setEmail(dto.getEmail());
            if (dto.getGenderIdentity() != null) user.setGenderIdentity(dto.getGenderIdentity());
            if (dto.getDistinctivePhrase() != null) user.setDistinctivePhrase(dto.getDistinctivePhrase());
            if (dto.getDescription() != null) user.setDescription(dto.getDescription());
            return userRepository.save(user);
        }
        return null;
    }

    public User updateSocialLinks(String username, UpdateUserSocialLinksDTO dto) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            if (dto.getGithub() != null) user.setGithub(buildGithubUrl(dto.getGithub()));
            if (dto.getInstagram() != null) user.setInstagram(buildInstagramUrl(dto.getInstagram()));
            if (dto.getFacebook() != null) user.setFacebook(buildFacebookUrl(dto.getFacebook()));
            if (dto.getXUsername() != null) user.setXUsername(buildXUrl(dto.getXUsername()));
            if (dto.getMastodon() != null) user.setMastodon(buildMastodonUrl(dto.getMastodon()));
            if (dto.getBluesky() != null) user.setBluesky(buildBlueskyUrl(dto.getBluesky()));
            if (dto.getTiktok() != null) user.setTiktok(buildTiktokUrl(dto.getTiktok()));
            if (dto.getLinkedIn() != null) user.setLinkedIn(buildLinkedInUrl(dto.getLinkedIn()));
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      URL BUILDERS
     * ==========================
     */

    private String buildGithubUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove @ if present
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        // Remove https://github.com/ if already present
        if (username.startsWith("https://github.com/")) {
            return username;
        }
        return "https://github.com/" + username;
    }

    private String buildInstagramUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove @ if present
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        // Remove https://instagram.com/ if already present
        if (username.startsWith("https://instagram.com/")) {
            return username;
        }
        return "https://instagram.com/" + username;
    }

    private String buildFacebookUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove https://facebook.com/ if already present
        if (username.startsWith("https://facebook.com/")) {
            return username;
        }
        return "https://facebook.com/" + username;
    }

    private String buildXUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove @ if present
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        // Remove https://x.com/ or https://twitter.com/ if already present
        if (username.startsWith("https://x.com/") || username.startsWith("https://twitter.com/")) {
            return username;
        }
        return "https://x.com/" + username;
    }

    private String buildMastodonUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // If it's already a full URL, return as is
        if (username.startsWith("https://")) {
            return username;
        }
        // If it contains @, it's likely in the format username@instance.com
        if (username.contains("@")) {
            String[] parts = username.split("@");
            if (parts.length == 2) {
                return "https://" + parts[1] + "/@" + parts[0];
            }
        }
        // Default to a common Mastodon instance if no instance specified
        return "https://mastodon.social/@" + username;
    }

    private String buildBlueskyUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove @ if present
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        // Remove https://bsky.app/ if already present
        if (username.startsWith("https://bsky.app/")) {
            return username;
        }
        return "https://bsky.app/profile/" + username;
    }

    private String buildTiktokUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // Remove @ if present
        if (username.startsWith("@")) {
            username = username.substring(1);
        }
        // Remove https://tiktok.com/@ if already present
        if (username.startsWith("https://tiktok.com/@")) {
            return username;
        }
        return "https://tiktok.com/@" + username;
    }

    private String buildLinkedInUrl(String username) {
        if (username == null || username.trim().isEmpty()) return null;
        username = username.trim();
        // If it's already a full URL, return as is
        if (username.startsWith("https://linkedin.com/") || username.startsWith("https://www.linkedin.com/")) {
            return username;
        }
        // If it looks like a profile ID, construct the URL
        if (username.matches("^[a-zA-Z0-9_-]+$")) {
            return "https://linkedin.com/in/" + username;
        }
        // If it's a full name, try to construct a profile URL
        return "https://linkedin.com/in/" + username.toLowerCase().replaceAll("\\s+", "-");
    }

    /* ==========================
     *      GALLERY MANAGEMENT
     * ==========================
     */

    public User addGalleryImage(String username, String imagePath) throws IOException, SQLException {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addGalleryImage(imagePath);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeGalleryImage(String username, int index) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.removeGalleryImage(index);
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      PROJECTS MANAGEMENT
     * ==========================
     */

    public User addProject(String username, Project project) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addProject(project);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeProject(String username, Long projectId) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.getProjects().removeIf(project -> project.getId().equals(projectId));
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      CERTIFICATES MANAGEMENT
     * ==========================
     */

    public User addCertificate(String username, Certificate certificate) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addCertificate(certificate);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeCertificate(String username, Long certificateId) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.getCertificates().removeIf(cert -> cert.getId().equals(certificateId));
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      COURSES MANAGEMENT
     * ==========================
     */

    public User addCourse(String username, Course course) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addCourse(course);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeCourse(String username, Long courseId) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.getCourses().removeIf(course -> course.getId().equals(courseId));
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      CV MANAGEMENT
     * ==========================
     */

    public User updateCV(String username, CV cv) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setCv(cv);
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      LIKES/DISLIKES MANAGEMENT
     * ==========================
     */

    public User addLike(String username, String like) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addLike(like);
            return userRepository.save(user);
        }
        return null;
    }

    public User addDislike(String username, String dislike) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.addDislike(dislike);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeLike(String username, String like) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.getLikes().remove(like);
            return userRepository.save(user);
        }
        return null;
    }

    public User removeDislike(String username, String dislike) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.getDislikes().remove(dislike);
            return userRepository.save(user);
        }
        return null;
    }

    /* ==========================
     *      SPRING SECURITY
     * ==========================
     */

    @Override
    public User loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username);
    }
}
