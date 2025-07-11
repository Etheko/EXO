package com.exo.controller;

import com.exo.model.User;
import com.exo.model.Project;
import com.exo.model.Certificate;
import com.exo.model.Course;
import com.exo.model.CV;
import com.exo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.exo.dto.UpdateUserBasicInfoDTO;
import com.exo.dto.UpdateUserSocialLinksDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URLConnection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for managing user profiles, gallery, projects, certificates, courses, and CV")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new user", description = "Creates a new user profile with all required information (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User created successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "400", description = "Invalid user data"),
        @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (!userService.isUsernameAvailable(user.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (!userService.isEmailAvailable(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        User savedUser = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @GetMapping("/{username}")
    @Operation(summary = "Get user by username", description = "Retrieves a user profile by their username")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User found",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> getUserByUsername(
            @Parameter(description = "Username of the user to retrieve") 
            @PathVariable String username) {
        Optional<User> user = userService.findByUsername(username);
        return user.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Retrieves a user profile by their email address")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User found",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> getUserByEmail(
            @Parameter(description = "Email address of the user to retrieve") 
            @PathVariable String email) {
        User user = userService.findByEmail(email);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieves all user profiles")
    @ApiResponse(responseCode = "200", description = "List of all users",
                content = @Content(schema = @Schema(implementation = User.class)))
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user", description = "Updates an existing user profile (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> updateUser(
            @Parameter(description = "Username of the user to update") 
            @PathVariable String username,
            @RequestBody User user) {
        if (!userService.findByUsername(username).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        user.setUsername(username);
        User updatedUser = userService.saveUser(user);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Deletes a user profile and all associated data (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "User deleted successfully"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "Username of the user to delete") 
            @PathVariable String username) {
        if (!userService.findByUsername(username).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(username);
        return ResponseEntity.noContent().build();
    }

    /* ==========================
     *      VALIDATION
     * ==========================
     */

    @GetMapping("/check-username/{username}")
    @Operation(summary = "Check username availability", description = "Checks if a username is available for registration")
    @ApiResponse(responseCode = "200", description = "Username availability status")
    public ResponseEntity<Boolean> isUsernameAvailable(
            @Parameter(description = "Username to check") 
            @PathVariable String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/check-email/{email}")
    @Operation(summary = "Check email availability", description = "Checks if an email is available for registration")
    @ApiResponse(responseCode = "200", description = "Email availability status")
    public ResponseEntity<Boolean> isEmailAvailable(
            @Parameter(description = "Email to check") 
            @PathVariable String email) {
        boolean available = userService.isEmailAvailable(email);
        return ResponseEntity.ok(available);
    }

    /* ==========================
     *      PROFILE MANAGEMENT
     * ==========================
     */

    /**
     * Upload a NEW profile picture by sending the raw image bytes.
     * 
     * front-end flow: user selects an image file – browser sends a multipart/form-data
     * request whose body contains the file part named pfp.
     * Expected header: Content-Type: multipart/form-data.
     */
    @PutMapping(path = "/{username}/pfp", consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload profile picture", description = "Uploads a new profile picture for the user (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile picture uploaded successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "400", description = "Invalid image file")
    })
    public ResponseEntity<User> uploadProfilePicture(
            @Parameter(description = "Username of the user")
            @PathVariable String username,
            @Parameter(description = "Profile picture file")
            @RequestPart("pfp") MultipartFile pfpFile) {
        try {
            User updatedUser = userService.uploadProfilePicture(username, pfpFile);
            return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Set the profile picture by specifying a server-side image path/URL.
     * 
     * Useful for admin scripts or initial data seeding where the file already
     * exists on disk. Accepts a simple imagePath query parameter.
     */
    @PutMapping("/{username}/profile-picture")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update profile picture", description = "Updates the user's profile picture (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile picture updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "400", description = "Invalid image path")
    })
    public ResponseEntity<User> updateProfilePicture(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Path to the new profile picture") 
            @RequestParam String imagePath) {
        try {
            User updatedUser = userService.updateProfilePicture(username, imagePath);
            return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{username}/basic-info")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update basic information", description = "Updates the user's basic personal information (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Basic info updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> updateBasicInfo(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody UpdateUserBasicInfoDTO basicInfoDTO) {
        User updatedUser = userService.updateBasicInfo(username, basicInfoDTO);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{username}/social-links")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update social links", description = "Updates the user's social media links (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Social links updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> updateSocialLinks(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody UpdateUserSocialLinksDTO socialLinksDTO) {
        User updatedUser = userService.updateSocialLinks(username, socialLinksDTO);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /**
     * Retrieve the raw bytes of the user's profile picture (as stored in the DB).
     * This is used by the front-end when pfpString contains `/api/users/{username}/pfp`.
     */
    @GetMapping(path = "/{username}/pfp")
    @Operation(summary = "Get profile picture", description = "Returns the user's profile picture bytes")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable String username) {
        try {
            byte[] bytes = userService.getProfilePicture(username);

            if (bytes == null || bytes.length == 0) {
                logger.warn("Profile picture not found or is empty for user: {}", username);
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            String ct;
            try (ByteArrayInputStream bis = new ByteArrayInputStream(bytes)) {
                ct = URLConnection.guessContentTypeFromStream(bis);
            }
            headers.setContentType(ct != null ? MediaType.parseMediaType(ct) : MediaType.APPLICATION_OCTET_STREAM);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Failed to get profile picture for user: " + username, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{username}/pfp")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove profile picture", description = "Removes the user's profile picture and resets it to the default (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Profile picture removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeProfilePicture(
            @Parameter(description = "Username of the user")
            @PathVariable String username) {
        User updatedUser = userService.removeProfilePicture(username);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      GALLERY MANAGEMENT
     * ==========================
     */

    @PostMapping("/{username}/gallery")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add gallery image", description = "Adds a new image to the user's gallery (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Image added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "400", description = "Invalid image path")
    })
    public ResponseEntity<User> addGalleryImage(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Path to the image to add") 
            @RequestParam String imagePath) {
        try {
            User updatedUser = userService.addGalleryImage(username, imagePath);
            return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{username}/gallery/{index}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove gallery image", description = "Removes an image from the user's gallery by index (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Image removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeGalleryImage(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Index of the image to remove") 
            @PathVariable int index) {
        User updatedUser = userService.removeGalleryImage(username, index);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      PROJECTS MANAGEMENT
     * ==========================
     */

    @PostMapping("/{username}/projects")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add project", description = "Adds a new project to the user's portfolio (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> addProject(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody Project project) {
        User updatedUser = userService.addProject(username, project);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}/projects/{projectId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove project", description = "Removes a project from the user's portfolio (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Project removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeProject(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "ID of the project to remove") 
            @PathVariable Long projectId) {
        User updatedUser = userService.removeProject(username, projectId);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      CERTIFICATES MANAGEMENT
     * ==========================
     */

    @PostMapping("/{username}/certificates")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add certificate", description = "Adds a new certificate to the user's profile (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Certificate added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> addCertificate(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody Certificate certificate) {
        User updatedUser = userService.addCertificate(username, certificate);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}/certificates/{certificateId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove certificate", description = "Removes a certificate from the user's profile (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Certificate removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeCertificate(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "ID of the certificate to remove") 
            @PathVariable Long certificateId) {
        User updatedUser = userService.removeCertificate(username, certificateId);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      COURSES MANAGEMENT
     * ==========================
     */

    @PostMapping("/{username}/courses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add course", description = "Adds a new course to the user's profile (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> addCourse(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody Course course) {
        User updatedUser = userService.addCourse(username, course);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove course", description = "Removes a course from the user's profile (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeCourse(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "ID of the course to remove") 
            @PathVariable Long courseId) {
        User updatedUser = userService.removeCourse(username, courseId);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      CV MANAGEMENT
     * ==========================
     */

    @PutMapping("/{username}/cv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update CV", description = "Updates the user's CV (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "CV updated successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> updateCV(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @RequestBody CV cv) {
        User updatedUser = userService.updateCV(username, cv);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      LIKES/DISLIKES MANAGEMENT
     * ==========================
     */

    @PostMapping("/{username}/likes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add like", description = "Adds a new like to the user's preferences (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Like added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> addLike(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Like to add") 
            @RequestParam String like) {
        User updatedUser = userService.addLike(username, like);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}/likes/{like}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove like", description = "Removes a like from the user's preferences (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Like removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeLike(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Like to remove") 
            @PathVariable String like) {
        User updatedUser = userService.removeLike(username, like);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{username}/dislikes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add dislike", description = "Adds a new dislike to the user's preferences (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dislike added successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> addDislike(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Dislike to add") 
            @RequestParam String dislike) {
        User updatedUser = userService.addDislike(username, dislike);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}/dislikes/{dislike}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove dislike", description = "Removes a dislike from the user's preferences (Admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dislike removed successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<User> removeDislike(
            @Parameter(description = "Username of the user") 
            @PathVariable String username,
            @Parameter(description = "Dislike to remove") 
            @PathVariable String dislike) {
        User updatedUser = userService.removeDislike(username, dislike);
        return updatedUser != null ? ResponseEntity.ok(updatedUser) : ResponseEntity.notFound().build();
    }
}
