package com.exo.config;

import com.exo.model.Section;
import com.exo.repository.SectionRepository;
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
public class SectionInitializer {
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @Value("${exo.force.section.init:false}")
    private boolean forceInit;
    
    @PostConstruct
    public void init() {
        // Force reinitialization if environment variable is set
        if (forceInit) {
            System.out.println("Force initialization enabled. Clearing all sections...");
            sectionRepository.deleteAll();
        }
        
        // Define the expected sections with their data
        List<Section> expectedSections = Arrays.asList(
            createSection("init-etheko", "INIT::Etheko()", "// Who am I?", "", 0, false, "about"),
            createSection("build-stream", "BUILD_STREAM[]", "// Current Projects", "", 1, true, "projects"),
            createSection("retro-log", "RETRO_LOG{}", "// Past Projects", "", 2, true, "projects"),
            createSection("modules-loaded", "MODULES_LOADED", "// Tech Stack", "", 3, false, "tech-stack"),
            createSection("ux-lab", "UX.LAB{👾}", "// Design Zone", "", 4, false, "design"),
            createSection("sys-sec-insights", "SYS_SEC::INSIGHTS", "// Cyber Logs", "", 5, false, "cyber-logs"),
            createSection("pipeline-workflow", "PIPELINE::WORKFLOW", "// DevOps & Agile", "", 6, false, "devops"),
            createSection("blog", "blog.txt", "// Thoughts & Posts", "", 7, false, "blog"),
            createSection("contact", "contact.txt", "// CV & Links", "", 8, false, "contact"),
            createSection("certs", "CERTS.log", "// Certificates & Courses", "", 9, false, "certificates")
        );
        
        // Get existing sections by slug for easy lookup
        Map<String, Section> existingSections = sectionRepository.findAll().stream()
            .collect(Collectors.toMap(Section::getSlug, section -> section));
        
        // Process each expected section
        for (Section expectedSection : expectedSections) {
            String slug = expectedSection.getSlug();
            Section existingSection = existingSections.get(slug);
            
            if (existingSection != null) {
                // Update existing section if data has changed
                boolean needsUpdate = !existingSection.getTitle().equals(expectedSection.getTitle()) ||
                                    !existingSection.getDescription().equals(expectedSection.getDescription()) ||
                                    !existingSection.getContent().equals(expectedSection.getContent()) ||
                                    !existingSection.getDisplayOrder().equals(expectedSection.getDisplayOrder()) ||
                                    !existingSection.getPublished().equals(expectedSection.getPublished()) ||
                                    !Objects.equals(expectedSection.getComponentType(), existingSection.getComponentType());
                
                if (needsUpdate) {
                    existingSection.setTitle(expectedSection.getTitle());
                    existingSection.setDescription(expectedSection.getDescription());
                    existingSection.setContent(expectedSection.getContent());
                    existingSection.setDisplayOrder(expectedSection.getDisplayOrder());
                    existingSection.setPublished(expectedSection.getPublished());
                    existingSection.setComponentType(expectedSection.getComponentType());
                    sectionRepository.save(existingSection);
                    System.out.println("Updated section: " + slug + " with componentType: " + expectedSection.getComponentType());
                }
            } else {
                // Create new section
                sectionRepository.save(expectedSection);
                System.out.println("Created new section: " + slug + " with componentType: " + expectedSection.getComponentType());
            }
        }
        
        // Remove sections that are no longer in the expected list
        List<String> expectedSlugs = expectedSections.stream()
            .map(Section::getSlug)
            .collect(Collectors.toList());
        
        List<Section> sectionsToDelete = existingSections.values().stream()
            .filter(section -> !expectedSlugs.contains(section.getSlug()))
            .collect(Collectors.toList());
        
        if (!sectionsToDelete.isEmpty()) {
            sectionRepository.deleteAll(sectionsToDelete);
            System.out.println("Deleted " + sectionsToDelete.size() + " sections: " + 
                sectionsToDelete.stream().map(Section::getSlug).collect(Collectors.joining(", ")));
        }
        
        System.out.println("Section initialization completed. Total sections: " + sectionRepository.count());
    }
    
    private Section createSection(String slug, String title, String description, String content, int displayOrder, boolean published, String componentType) {
        Section section = new Section();
        section.setSlug(slug);
        section.setTitle(title);
        section.setDescription(description);
        section.setContent(content);
        section.setDisplayOrder(displayOrder);
        section.setPublished(published);
        section.setComponentType(componentType);
        return section;
    }
}
