package com.exo.config;

import com.exo.model.Project;
import com.exo.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProjectRepository projectRepository;

    @Override
    public void run(String... args) {
        // Only add sample data if the database is empty
        if (projectRepository.count() == 0) {
            Project project1 = new Project();
            project1.setTitle("Portfolio Website");
            project1.setDescription("A modern portfolio website built with React, Spring Boot, and MySQL.");
            project1.setTechnologies(Arrays.asList("React", "Spring Boot", "MySQL", "Tailwind CSS"));
            project1.setGithubUrl("https://github.com/yourusername/portfolio");
            project1.setLiveUrl("https://your-portfolio.com");

            Project project2 = new Project();
            project2.setTitle("Task Management App");
            project2.setDescription("A full-stack task management application with real-time updates.");
            project2.setTechnologies(Arrays.asList("Angular", "Node.js", "MongoDB", "Socket.io"));
            project2.setGithubUrl("https://github.com/yourusername/task-manager");

            projectRepository.saveAll(Arrays.asList(project1, project2));
        }
    }
} 