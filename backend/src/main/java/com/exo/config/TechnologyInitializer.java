package com.exo.config;

import com.exo.model.Technology;
import com.exo.repository.TechnologyRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class TechnologyInitializer {

    @Autowired
    private TechnologyRepository technologyRepository;

    @Value("${exo.force.technology.init:false}")
    private boolean forceInit;

    @PostConstruct
    public void init() {
        if (forceInit) {
            System.out.println("Forcing technology initialization. Deleting all technologies...");
            technologyRepository.deleteAll();
        }

        List<Technology> expectedTechnologies = Arrays.asList(
                createTechnology("Java", "The powerhouse of enterprise software, used for building robust, large-scale applications.", "https://www.java.com", "/assets/technologies/java.png"),
                createTechnology("Spring Boot", "The framework for rapid, production-ready Spring applications. It simplifies setup and development.", "https://spring.io/projects/spring-boot", "/assets/technologies/spring-boot.png"),
                createTechnology("Angular", "A comprehensive platform for building web applications, known for its powerful features and structure.", "https://angular.io", "/assets/technologies/angular.png"),
                createTechnology("React", "A declarative JavaScript library for building user interfaces, famous for its component-based architecture.", "https://reactjs.org", "/assets/technologies/react.png"),
                createTechnology("TypeScript", "A superset of JavaScript that adds static types, improving code quality and maintainability.", "https://www.typescriptlang.org", "/assets/technologies/typescript.png"),
                createTechnology("PostgreSQL", "A powerful, open-source object-relational database system with a strong reputation for reliability.", "https://www.postgresql.org", "/assets/technologies/postgresql.png"),
                createTechnology("MySQL", "The world's most popular open-source database, widely used in web applications.", "https://www.mysql.com", "/assets/technologies/mysql.png"),
                createTechnology("Docker", "The platform for developing, shipping, and running applications in containers, ensuring consistency across environments.", "https://www.docker.com", "/assets/technologies/docker.png"),
                createTechnology("Tailwind CSS", "A utility-first CSS framework for rapidly building custom designs without leaving your HTML.", "https://tailwindcss.com", "/assets/technologies/tailwind-css.png"),
                createTechnology("WebSockets", "A communication protocol providing full-duplex communication channels over a single TCP connection.", "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", "/assets/technologies/websockets.png")
        );

        Map<String, Technology> existingTechnologies = technologyRepository.findAll().stream()
                .collect(Collectors.toMap(Technology::getName, t -> t));

        for (Technology expected : expectedTechnologies) {
            Technology existing = existingTechnologies.get(expected.getName());
            if (existing != null) {
                boolean needsUpdate = !Objects.equals(existing.getDescription(), expected.getDescription()) ||
                        !Objects.equals(existing.getLink(), expected.getLink()) ||
                        !Objects.equals(existing.getIconString(), expected.getIconString());

                if (needsUpdate) {
                    existing.setDescription(expected.getDescription());
                    existing.setLink(expected.getLink());
                    existing.setIconString(expected.getIconString());
                    try {
                        existing.setIcon(existing.localImageToBlob(expected.getIconString()));
                    } catch (Exception e) {
                        System.err.println("Warning: Could not update icon for technology: " + existing.getName() + " - " + e.getMessage());
                    }
                    technologyRepository.save(existing);
                    System.out.println("Updated technology: " + existing.getName());
                }
            } else {
                try {
                    technologyRepository.save(expected);
                    System.out.println("Created new technology: " + expected.getName());
                } catch (Exception e) {
                    System.err.println("Error creating technology: " + expected.getName() + " - " + e.getMessage());
                }
            }
        }

        List<String> expectedNames = expectedTechnologies.stream()
                .map(Technology::getName)
                .collect(Collectors.toList());
        
        List<Technology> toDelete = existingTechnologies.values().stream()
                .filter(t -> !expectedNames.contains(t.getName()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            technologyRepository.deleteAll(toDelete);
            System.out.println("Deleted " + toDelete.size() + " obsolete technologies.");
        }

        System.out.println("Technology initialization completed. Total technologies: " + technologyRepository.count());
    }

    private Technology createTechnology(String name, String description, String link, String iconPath) {
        try {
            return new Technology(name, description, link, iconPath);
        } catch (Exception e) {
            System.err.println("Error creating technology object for: " + name + " - " + e.getMessage());
            Technology tech = new Technology();
            tech.setName(name);
            tech.setDescription(description);
            tech.setLink(link);
            tech.setIconString(iconPath);
            return tech;
        }
    }
}
