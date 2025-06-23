package com.exo.service;

import com.exo.model.User;
import com.exo.model.Project;
import com.exo.model.Certificate;
import com.exo.model.Course;
import com.exo.model.CV;
import com.exo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

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

    public User updateProfilePicture(String username, String imagePath) throws IOException, SQLException {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setPfpString(imagePath);
            user.setPfp(user.localImageToBlob(imagePath));
            return userRepository.save(user);
        }
        return null;
    }

    public User updateBasicInfo(String username, String realName, String firstSurname, 
                               String secondSurname, String nick, String email, 
                               String distinctivePhrase, String description) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setRealName(realName);
            user.setFirstSurname(firstSurname);
            user.setSecondSurname(secondSurname);
            user.setNick(nick);
            user.setEmail(email);
            user.setDistinctivePhrase(distinctivePhrase);
            user.setDescription(description);
            return userRepository.save(user);
        }
        return null;
    }

    public User updateSocialLinks(String username, String instagram, String xUsername, 
                                 String linkedIn, String github) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setInstagram(instagram);
            user.setXUsername(xUsername);
            user.setLinkedIn(linkedIn);
            user.setGithub(github);
            return userRepository.save(user);
        }
        return null;
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
}
