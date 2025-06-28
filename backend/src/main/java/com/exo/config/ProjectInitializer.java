package com.exo.config;

import com.exo.model.Project;
import com.exo.repository.ProjectRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Objects;

@Component
public class ProjectInitializer {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Value("${exo.force.project.init:false}")
    private boolean forceInit;
    
    @PostConstruct
    public void init() {
        // Force reinitialization if environment variable is set
        if (forceInit) {
            System.out.println("Force initialization enabled. Clearing all projects...");
            projectRepository.deleteAll();
        }
        
        // Define the expected projects with their data
        List<Project> expectedProjects = Arrays.asList(
            createProject("EXO", "Project EXO", 
                "This website: The ✨Etheko Experience Online✨.",
                false,
                "/assets/projects/project-exo-header.png",
                "/assets/projects/project-exo-logo.svg",
                Arrays.asList("React", "TypeScript", "Spring Boot", "PostgreSQL", "Tailwind CSS"),
                null,
                "https://etheko.dev",
                "https://github.com/Etheko/EXO", null, null, null, null, null, null,
                Arrays.asList(
                    "/assets/projects/project-exo-gallery1.png",
                    "/assets/projects/project-exo-gallery2.png",
                    "/assets/projects/project-exo-gallery3.png"
                )),

        createProject("bookmarks-forums", "Bookmarks Forums",
            "2024 Bookmarks Forums project extends a book-tracking platform into a social web application, letting users not only log their reading habits but also connect around them. Its main purpose is to foster community engagement through posts and chats. Users can follow each other, join book-related communities, and interact in real time.",
            true,
            "/assets/projects/bookmarks-forums-header.png",
            "/assets/projects/bookmarks-forums-logo.svg",
            Arrays.asList("Java", "Spring Boot", "Angular", "Docker", "MySQL", "WebSockets"),
            null,
            null,
            "codeurjc-students/2024-Bookmarks-Forums", null, null, null, null, null, null,
            Arrays.asList(
                    "/assets/projects/bookmarks-forums-gallery1.png",
                    "/assets/projects/bookmarks-forums-gallery2.png",
                    "/assets/projects/bookmarks-forums-gallery3.png",
                    "/assets/projects/bookmarks-forums-gallery4.png",
                    "/assets/projects/bookmarks-forums-gallery5.png",
                    "/assets/projects/bookmarks-forums-gallery6.png",
                    "/assets/projects/bookmarks-forums-gallery7.png",
                    "/assets/projects/bookmarks-forums-gallery8.png",
                    "/assets/projects/bookmarks-forums-gallery9.png",
                    "/assets/projects/bookmarks-forums-gallery10.png",
                    "/assets/projects/bookmarks-forums-gallery11.png"
            ))
        );
        
        // Get existing projects by title for easy lookup
        Map<String, Project> existingProjects = projectRepository.findAll().stream()
            .collect(Collectors.toMap(Project::getTitle, project -> project));
        
        // Process each expected project
        for (Project expectedProject : expectedProjects) {
            String title = expectedProject.getTitle();
            Project existingProject = existingProjects.get(title);
            
            if (existingProject != null) {
                // Update existing project if data has changed
                boolean needsUpdate = !existingProject.getDescription().equals(expectedProject.getDescription()) ||
                                    !Objects.equals(existingProject.getHeaderPictureString(), expectedProject.getHeaderPictureString()) ||
                                    !existingProject.getTechnologies().equals(expectedProject.getTechnologies()) ||
                                    !Objects.equals(existingProject.getLiveDemoUrl(), expectedProject.getLiveDemoUrl()) ||
                                    !Objects.equals(existingProject.getProjectWebsiteUrl(), expectedProject.getProjectWebsiteUrl()) ||
                                    !Objects.equals(existingProject.getGithub(), expectedProject.getGithub()) ||
                                    !Objects.equals(existingProject.getInstagram(), expectedProject.getInstagram()) ||
                                    !Objects.equals(existingProject.getFacebook(), expectedProject.getFacebook()) ||
                                    !Objects.equals(existingProject.getXUsername(), expectedProject.getXUsername()) ||
                                    !Objects.equals(existingProject.getMastodon(), expectedProject.getMastodon()) ||
                                    !Objects.equals(existingProject.getBluesky(), expectedProject.getBluesky()) ||
                                    !Objects.equals(existingProject.getTiktok(), expectedProject.getTiktok()) ||
                                    !Objects.equals(existingProject.getIconString(), expectedProject.getIconString()) ||
                                    !Objects.equals(existingProject.getGalleryImagePaths(), expectedProject.getGalleryImagePaths()) ||
                                    existingProject.isFinished() != expectedProject.isFinished();
                
                if (needsUpdate) {
                    // Capture old image paths before modifying them
                    String oldHeaderPath = existingProject.getHeaderPictureString();
                    String oldIconPath = existingProject.getIconString();

                    existingProject.setDescription(expectedProject.getDescription());
                    existingProject.setHeaderPictureString(expectedProject.getHeaderPictureString());
                    existingProject.setTechnologies(expectedProject.getTechnologies());
                    existingProject.setLiveDemoUrl(expectedProject.getLiveDemoUrl());
                    existingProject.setProjectWebsiteUrl(expectedProject.getProjectWebsiteUrl());
                    existingProject.setGithub(expectedProject.getGithub());
                    existingProject.setInstagram(expectedProject.getInstagram());
                    existingProject.setFacebook(expectedProject.getFacebook());
                    existingProject.setXUsername(expectedProject.getXUsername());
                    existingProject.setMastodon(expectedProject.getMastodon());
                    existingProject.setBluesky(expectedProject.getBluesky());
                    existingProject.setTiktok(expectedProject.getTiktok());
                    existingProject.setIconString(expectedProject.getIconString());
                    existingProject.setFinished(expectedProject.isFinished());
                    
                    try {
                        // Update blobs only if the path has actually changed
                        if (!Objects.equals(oldHeaderPath, expectedProject.getHeaderPictureString())) {
                            existingProject.setHeaderPicture(existingProject.localImageToBlob(expectedProject.getHeaderPictureString()));
                        }

                        if (!Objects.equals(oldIconPath, expectedProject.getIconString())) {
                            existingProject.setIcon(existingProject.localImageToBlob(expectedProject.getIconString()));
                        }
                    } catch (Exception e) {
                        System.err.println("Warning: Could not update images for project: " + title + " - " + e.getMessage());
                    }
                    
                    projectRepository.save(existingProject);
                    System.out.println("Updated project: " + title);
                }
            } else {
                // Create new project
                try {
                    projectRepository.save(expectedProject);
                    System.out.println("Created new project: " + title);
                } catch (Exception e) {
                    System.err.println("Error creating project: " + title + " - " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        
        // Remove projects that are no longer in the expected list
        List<String> expectedTitles = expectedProjects.stream()
            .map(Project::getTitle)
            .collect(Collectors.toList());
        
        List<Project> projectsToDelete = existingProjects.values().stream()
            .filter(project -> !expectedTitles.contains(project.getTitle()))
            .collect(Collectors.toList());
        
        if (!projectsToDelete.isEmpty()) {
            projectRepository.deleteAll(projectsToDelete);
            System.out.println("Deleted " + projectsToDelete.size() + " projects: " + 
                projectsToDelete.stream().map(Project::getTitle).collect(Collectors.joining(", ")));
        }
        
        System.out.println("Project initialization completed. Total projects: " + projectRepository.count());
    }
    
    private Project createProject(String slug, String title, String description, boolean finished, String headerPicturePath, String iconPath,
                                List<String> technologies, String liveDemoUrl, String projectWebsiteUrl,
                                String github, String instagram, String facebook, String xUsername,
                                String mastodon, String bluesky, String tiktok, List<String> galleryImagePaths) {
        try {
            return new Project(title, description, finished, headerPicturePath, technologies, liveDemoUrl, 
                             projectWebsiteUrl, github, instagram, facebook, xUsername, 
                             mastodon, bluesky, tiktok, iconPath, galleryImagePaths);
        } catch (Exception e) {
            System.err.println("Error creating project object for: " + title + " - " + e.getMessage());
            // Return a basic project without blob operations if there's an error
            Project project = new Project();
            project.setTitle(title);
            project.setDescription(description);
            project.setFinished(finished);
            project.setHeaderPictureString(headerPicturePath);
            project.setIconString(iconPath);
            project.setTechnologies(technologies);
            project.setLiveDemoUrl(liveDemoUrl);
            project.setProjectWebsiteUrl(projectWebsiteUrl);
            project.setGithub(github);
            project.setInstagram(instagram);
            project.setFacebook(facebook);
            project.setXUsername(xUsername);
            project.setMastodon(mastodon);
            project.setBluesky(bluesky);
            project.setTiktok(tiktok);
            return project;
        }
    }
} 