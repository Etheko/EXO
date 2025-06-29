package com.exo.service;

import com.exo.model.Project;
import com.exo.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.Blob;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    // Basic CRUD operations
    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public Optional<Project> findById(Long id) {
        return projectRepository.findById(id);
    }

    public Project save(Project project) {
        return projectRepository.save(project);
    }

    @Transactional
    public Project createDefaultProject(boolean finished) {
        Project project = new Project();

        project.setTitle("New Project");

        project.setDescription("This is a new project. You can edit this description.");
        project.setFinished(finished);

        // Set default images by providing their paths
        project.setHeaderPictureString("/assets/defaultProjectHeader.png");
        project.setIconString("/assets/defaultProjectIcon.png");
        try {
            project.setHeaderPicture(project.localImageToBlob(project.getHeaderPictureString()));
            project.setIcon(project.localImageToBlob(project.getIconString()));
        } catch (IOException | SQLException e) {
            System.err.println("Warning: Could not set default blob images for new project: " + e.getMessage());
        }

        project.setTechnologies(new ArrayList<>());
        project.setGalleryImagePaths(new ArrayList<>());
        project.setGallery(new ArrayList<>());

        return projectRepository.save(project);
    }

    public void deleteById(Long id) {
        projectRepository.deleteById(id);
    }

    // Search and filtering operations
    public Page<Project> findByTitleContaining(String title, Pageable pageable) {
        return projectRepository.findByTitleContainingIgnoreCase(title, pageable);
    }

    public Page<Project> findByDescriptionContaining(String description, Pageable pageable) {
        return projectRepository.findByDescriptionContainingIgnoreCase(description, pageable);
    }

    public Page<Project> findByTechnology(String technology, Pageable pageable) {
        return projectRepository.findByTechnology(technology, pageable);
    }

    public Page<Project> findByTechnologies(List<String> technologies, Pageable pageable) {
        return projectRepository.findByTechnologiesIn(technologies, pageable);
    }

    public Page<Project> searchProjects(String query, Pageable pageable) {
        return projectRepository.searchProjects(query, pageable);
    }

    // Date-based filtering
    public Page<Project> findByCreatedAfter(LocalDateTime date, Pageable pageable) {
        return projectRepository.findByCreatedAtAfter(date, pageable);
    }

    public Page<Project> findByCreatedBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return projectRepository.findByCreatedAtBetween(startDate, endDate, pageable);
    }

    // Link-based filtering
    public Page<Project> findProjectsWithLiveDemo(Pageable pageable) {
        return projectRepository.findByLiveDemoUrlIsNotNull(pageable);
    }

    public Page<Project> findProjectsWithGithub(Pageable pageable) {
        return projectRepository.findByGithubIsNotNull(pageable);
    }

    // Sorting operations
    public Page<Project> findAllByCreationDateDesc(Pageable pageable) {
        return projectRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<Project> findAllByTitleAsc(Pageable pageable) {
        return projectRepository.findAllByOrderByTitleAsc(pageable);
    }

    public Page<Project> findProjectsByTechnologyCount(Pageable pageable) {
        return projectRepository.findProjectsByTechnologyCount(pageable);
    }

    // Batch operations
    @Transactional
    public void batchUpdateFinishedStatus(List<Long> ids, boolean finished) {
        if (ids != null && !ids.isEmpty()) {
            projectRepository.updateFinishedStatusForIds(finished, ids);
        }
    }

    // Statistics and analytics
    public List<Object[]> getTechnologyStatistics() {
        return projectRepository.countProjectsByTechnology();
    }

    // Gallery management
    @Transactional
    public Project updateGallery(Long projectId, List<String> pathsToDelete, List<MultipartFile> filesToAdd) throws IOException, SQLException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        List<Blob> currentBlobs = project.getGallery();
        List<String> currentPaths = project.getGalleryImagePaths();

        List<Blob> nextBlobs = new ArrayList<>();
        List<String> nextPaths = new ArrayList<>();

        if (pathsToDelete != null && !pathsToDelete.isEmpty()) {
            for (int i = 0; i < currentPaths.size(); i++) {
                if (!pathsToDelete.contains(currentPaths.get(i))) {
                    nextBlobs.add(currentBlobs.get(i));
                    nextPaths.add(currentPaths.get(i));
                }
            }
        } else {
            nextBlobs.addAll(currentBlobs);
            nextPaths.addAll(currentPaths);
        }

        project.getGallery().clear();
        project.getGallery().addAll(nextBlobs);
        project.getGalleryImagePaths().clear();

        if (filesToAdd != null && !filesToAdd.isEmpty()) {
            for (MultipartFile file : filesToAdd) {
                Blob blob = new javax.sql.rowset.serial.SerialBlob(file.getBytes());
                project.getGallery().add(blob);
            }
        }

        for (int i = 0; i < project.getGallery().size(); i++) {
            project.getGalleryImagePaths().add("/api/projects/" + projectId + "/gallery/" + i);
        }

        return projectRepository.save(project);
    }

    public void removeGalleryImage(Long projectId, int index) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.removeGalleryImage(index);
            projectRepository.save(project);
        }
    }

    public List<String> getGalleryImagePaths(Long projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            return project.getGalleryImagePaths();
        }
        return null;
    }

    public byte[] getGalleryImage(Long projectId, int index) throws SQLException, IOException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null || project.getGallery() == null || index < 0 || index >= project.getGallery().size()) {
            return null;
        }
        Blob imageBlob = project.getGallery().get(index);
        if (imageBlob != null) {
            return imageBlob.getBytes(1, (int) imageBlob.length());
        }
        return null;
    }

    // Technology management
    public void addTechnology(Long projectId, String technology) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.addTechnology(technology);
            projectRepository.save(project);
        }
    }

    public void removeTechnology(Long projectId, String technology) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.removeTechnology(technology);
            projectRepository.save(project);
        }
    }

    // Header picture management
    public void updateHeaderPicture(Long projectId, String imagePath) throws IOException, SQLException {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.setHeaderPictureString(imagePath);
            project.setHeaderPicture(project.localImageToBlob(imagePath, "/assets/defaultProjectHeader.png"));
            projectRepository.save(project);
        }
    }

    public void updateHeaderPicture(Long projectId, Blob imageBlob, String imagePath) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.setHeaderPicture(imageBlob);
            project.setHeaderPictureString(imagePath);
            projectRepository.save(project);
        }
    }

    /* ==========================
     *   HEADER PICTURE MANAGEMENT
     * ==========================
     */

    public byte[] getHeaderPicture(Long projectId) throws SQLException, IOException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return null;
        }

        Blob headerBlob = project.getHeaderPicture();

        if (headerBlob == null && project.getHeaderPictureString() != null) {
            try {
                headerBlob = project.localImageToBlob(project.getHeaderPictureString(), "/assets/defaultProjectHeader.png");
                project.setHeaderPicture(headerBlob);
                projectRepository.save(project);
            } catch (Exception ignored) {
                // If loading fails, we will return null later
            }
        }

        if (headerBlob != null) {
            return headerBlob.getBytes(1, (int) headerBlob.length());
        }
        return null;
    }

    @Transactional
    public Project uploadHeaderPicture(Long projectId, MultipartFile file) throws IOException, SQLException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            project.setHeaderPicture(new javax.sql.rowset.serial.SerialBlob(file.getBytes()));
            project.setHeaderPictureString("/api/projects/" + projectId + "/header");
            return projectRepository.save(project);
        }
        return null;
    }

    // Validation methods
    public boolean existsById(Long id) {
        return projectRepository.existsById(id);
    }

    public boolean existsByTitle(String title) {
        return projectRepository.existsByTitleIgnoreCase(title);
    }

    // Bulk operations
    public List<Project> saveAll(List<Project> projects) {
        return projectRepository.saveAll(projects);
    }

    public void deleteAll() {
        projectRepository.deleteAll();
    }

    // Recent projects
    public List<Project> findRecentProjects(int limit) {
        return projectRepository.findAllByOrderByCreatedAtDesc(Pageable.ofSize(limit)).getContent();
    }

    // Projects by technology count
    public List<Project> findProjectsWithMostTechnologies(int limit) {
        return projectRepository.findProjectsByTechnologyCount(Pageable.ofSize(limit)).getContent();
    }

    /* ==========================
     *        ICON MANAGEMENT
     * ==========================
     */

    public byte[] getIcon(Long projectId) throws SQLException, IOException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return null;
        }

        Blob iconBlob = project.getIcon();

        // Lazily load the icon from the stored path if it is not yet persisted
        if (iconBlob == null && project.getIconString() != null) {
            try {
                iconBlob = project.localImageToBlob(project.getIconString(), "/assets/defaultProjectIcon.png");
                project.setIcon(iconBlob);
                projectRepository.save(project);
            } catch (Exception ignored) {
                // If loading fails, we will return null later
            }
        }

        if (iconBlob != null) {
            return iconBlob.getBytes(1, (int) iconBlob.length());
        }
        return null;
    }

    @Transactional
    public Project uploadIcon(Long projectId, MultipartFile file) throws IOException, SQLException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            project.setIcon(new javax.sql.rowset.serial.SerialBlob(file.getBytes()));
            project.setIconString("/api/projects/" + projectId + "/icon");
            return projectRepository.save(project);
        }
        return null;
    }

    @Transactional
    public Project updateIcon(Long projectId, String imagePath) throws IOException, SQLException {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            project.setIconString(imagePath);
            project.setIcon(project.localImageToBlob(imagePath, "/assets/defaultProjectIcon.png"));
            return projectRepository.save(project);
        }
        return null;
    }
} 