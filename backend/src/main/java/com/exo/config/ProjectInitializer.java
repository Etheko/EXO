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
                "https://github.com/Etheko/EXO", null, null, null, null, null, null),
                
            createProject("task-management-app", "Task Management App",
                "A full-stack task management application with real-time updates, user authentication, and collaborative features.",
                true,
                null,
                null,
                Arrays.asList("Angular", "Node.js", "MongoDB", "Socket.io", "Express"),
                "https://task-manager-demo.com",
                "https://task-manager-demo.com",
                "yourusername", null, null, null, null, null, null),
                
            createProject("ecommerce-platform", "E-commerce Platform",
                "A complete e-commerce solution with payment processing, inventory management, and admin dashboard.",
                false,
                null,
                null,
                Arrays.asList("Vue.js", "Spring Boot", "PostgreSQL", "Stripe API", "Redis"),
                "https://ecommerce-demo.com",
                "https://ecommerce-demo.com",
                "yourusername", "yourstore", "yourstore", "yourstore", null, null, "yourstore"),

        createProject("ai-chat-assistant", "AI Chat Assistant",
            "An intelligent chatbot powered by machine learning that provides contextual responses and learns from conversations.",
            true,
            null,
            null,
            Arrays.asList("Python", "TensorFlow", "Flask", "React", "PostgreSQL", "Redis"),
            "https://ai-chat-demo.com",
            "https://ai-chat-demo.com",
            "yourusername", null, null, null, null, null, null)
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
                                String mastodon, String bluesky, String tiktok) {
        try {
            return new Project(title, description, finished, headerPicturePath, technologies, liveDemoUrl, 
                             projectWebsiteUrl, github, instagram, facebook, xUsername, 
                             mastodon, bluesky, tiktok, iconPath);
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