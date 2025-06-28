package com.exo.controller;

import com.exo.model.Project;
import com.exo.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.net.URLConnection;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Project Management", description = "APIs for managing projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // Basic CRUD operations
    @GetMapping
    @Operation(summary = "Get all projects", description = "Retrieve a list of all projects with pagination")
    public ResponseEntity<Page<Project>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(projectService.findAllByCreationDateDesc(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID", description = "Retrieve a specific project by its ID")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new project", description = "Create a new project (Admin only)")
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        return ResponseEntity.ok(projectService.save(project));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update project", description = "Update an existing project (Admin only)")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
        return projectService.findById(id)
                .map(existingProject -> {
                    project.setId(id);
                    return ResponseEntity.ok(projectService.save(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete project", description = "Delete a project by ID (Admin only)")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        return projectService.findById(id)
                .map(project -> {
                    projectService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Search and filtering endpoints
    @GetMapping("/search")
    @Operation(summary = "Search projects", description = "Search projects by title or description")
    public ResponseEntity<Page<Project>> searchProjects(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.searchProjects(query, pageable));
    }

    @GetMapping("/by-title")
    @Operation(summary = "Find projects by title", description = "Find projects containing the given title")
    public ResponseEntity<Page<Project>> findByTitle(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.findByTitleContaining(title, pageable));
    }

    @GetMapping("/by-technology")
    @Operation(summary = "Find projects by technology", description = "Find projects that use a specific technology")
    public ResponseEntity<Page<Project>> findByTechnology(
            @RequestParam String technology,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.findByTechnology(technology, pageable));
    }

    @GetMapping("/by-technologies")
    @Operation(summary = "Find projects by multiple technologies", description = "Find projects that use any of the specified technologies")
    public ResponseEntity<Page<Project>> findByTechnologies(
            @RequestParam List<String> technologies,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.findByTechnologies(technologies, pageable));
    }

    // Date-based filtering
    @GetMapping("/recent")
    @Operation(summary = "Get recent projects", description = "Get the most recently created projects")
    public ResponseEntity<List<Project>> getRecentProjects(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(projectService.findRecentProjects(limit));
    }

    @GetMapping("/by-date-range")
    @Operation(summary = "Find projects by date range", description = "Find projects created between two dates")
    public ResponseEntity<Page<Project>> findByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        Pageable pageable = PageRequest.of(page, size);
        
        return ResponseEntity.ok(projectService.findByCreatedBetween(start, end, pageable));
    }

    // Link-based filtering
    @GetMapping("/with-live-demo")
    @Operation(summary = "Get projects with live demo", description = "Get projects that have a live demo URL")
    public ResponseEntity<Page<Project>> getProjectsWithLiveDemo(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.findProjectsWithLiveDemo(pageable));
    }

    @GetMapping("/with-github")
    @Operation(summary = "Get projects with GitHub", description = "Get projects that have a GitHub URL")
    public ResponseEntity<Page<Project>> getProjectsWithGithub(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.findProjectsWithGithub(pageable));
    }

    // Gallery management
    @PostMapping("/{id}/gallery")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add gallery image", description = "Add an image to the project gallery (Admin only)")
    public ResponseEntity<Void> addGalleryImage(
            @PathVariable Long id,
            @RequestParam String imagePath) {
        try {
            projectService.addGalleryImage(id, imagePath);
            return ResponseEntity.ok().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}/gallery/{index}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove gallery image", description = "Remove an image from the project gallery by index (Admin only)")
    public ResponseEntity<Void> removeGalleryImage(
            @PathVariable Long id,
            @PathVariable int index) {
        projectService.removeGalleryImage(id, index);
        return ResponseEntity.ok().build();
    }

    @GetMapping(path = "/{id}/gallery-paths")
    @Operation(summary = "Get project gallery paths", description = "Returns the project's gallery image paths")
    public ResponseEntity<List<String>> getProjectGalleryPaths(@PathVariable Long id) {
        List<String> paths = projectService.getGalleryImagePaths(id);
        if (paths == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(paths);
    }

    @GetMapping(path = "/{id}/gallery/{index}")
    @Operation(summary = "Get project gallery image", description = "Returns a specific gallery image by index")
    public ResponseEntity<byte[]> getProjectGalleryImage(@PathVariable Long id, @PathVariable int index) {
        try {
            byte[] bytes = projectService.getGalleryImage(id, index);

            if (bytes == null || bytes.length == 0) {
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
            return ResponseEntity.internalServerError().build();
        }
    }

    // Technology management
    @PostMapping("/{id}/technologies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add technology", description = "Add a technology to the project (Admin only)")
    public ResponseEntity<Void> addTechnology(
            @PathVariable Long id,
            @RequestParam String technology) {
        projectService.addTechnology(id, technology);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/technologies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove technology", description = "Remove a technology from the project (Admin only)")
    public ResponseEntity<Void> removeTechnology(
            @PathVariable Long id,
            @RequestParam String technology) {
        projectService.removeTechnology(id, technology);
        return ResponseEntity.ok().build();
    }

    // Header picture management
    @PutMapping("/{id}/header-picture")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update header picture", description = "Update the project header picture (Admin only)")
    public ResponseEntity<Void> updateHeaderPicture(
            @PathVariable Long id,
            @RequestParam String imagePath) {
        try {
            projectService.updateHeaderPicture(id, imagePath);
            return ResponseEntity.ok().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *   HEADER PICTURE MANAGEMENT
     * ==========================
     */

    @GetMapping(path = "/{id}/header")
    @Operation(summary = "Get project header", description = "Returns the project's header bytes")
    public ResponseEntity<byte[]> getProjectHeaderPicture(@PathVariable Long id) {
        try {
            byte[] bytes = projectService.getHeaderPicture(id);

            if (bytes == null || bytes.length == 0) {
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
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(path = "/{id}/header", consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload project header", description = "Uploads a new header for the project (Admin only)")
    public ResponseEntity<Project> uploadProjectHeader(
            @PathVariable Long id,
            @RequestPart("header") MultipartFile headerFile) {
        try {
            Project updated = projectService.uploadHeaderPicture(id, headerFile);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *        ICON MANAGEMENT
     * ==========================
     */

    @GetMapping(path = "/{id}/icon")
    @Operation(summary = "Get project icon", description = "Returns the project's icon bytes")
    public ResponseEntity<byte[]> getProjectIcon(@PathVariable Long id) {
        try {
            byte[] bytes = projectService.getIcon(id);

            if (bytes == null || bytes.length == 0) {
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
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(path = "/{id}/icon", consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload project icon", description = "Uploads a new icon for the project (Admin only)")
    public ResponseEntity<Project> uploadProjectIcon(
            @PathVariable Long id,
            @RequestPart("icon") MultipartFile iconFile) {
        try {
            Project updated = projectService.uploadIcon(id, iconFile);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/icon-path")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update project icon", description = "Updates the project's icon by specifying an existing path (Admin only)")
    public ResponseEntity<Project> updateProjectIcon(
            @PathVariable Long id,
            @RequestParam String imagePath) {
        try {
            Project updated = projectService.updateIcon(id, imagePath);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Statistics and analytics
    @GetMapping("/statistics/technologies")
    @Operation(summary = "Get technology statistics", description = "Get statistics about technology usage across projects")
    public ResponseEntity<List<Object[]>> getTechnologyStatistics() {
        return ResponseEntity.ok(projectService.getTechnologyStatistics());
    }

    @GetMapping("/most-technologies")
    @Operation(summary = "Get projects with most technologies", description = "Get projects ordered by number of technologies used")
    public ResponseEntity<List<Project>> getProjectsWithMostTechnologies(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(projectService.findProjectsWithMostTechnologies(limit));
    }

    // Validation endpoints
    @GetMapping("/exists/{id}")
    @Operation(summary = "Check if project exists", description = "Check if a project with the given ID exists")
    public ResponseEntity<Boolean> projectExists(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.existsById(id));
    }

    @GetMapping("/exists/title")
    @Operation(summary = "Check if project title exists", description = "Check if a project with the given title exists")
    public ResponseEntity<Boolean> projectTitleExists(@RequestParam String title) {
        return ResponseEntity.ok(projectService.existsByTitle(title));
    }
} 