package com.exo.config;

import com.exo.model.Section;
import com.exo.repository.SectionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class SectionInitializer {
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @PostConstruct
    public void init() {
        // Check if sections already exist to avoid duplicates
        if (sectionRepository.count() > 0) {
            return;
        }
        
        List<Section> sections = Arrays.asList(
            createSection(0, "init-etheko", "INIT::Etheko()", "// Who am I?", "", 0, true),
            createSection(1, "build-stream", "BUILD_STREAM[]", "// Current Projects", "", 1, true),
            createSection(2, "retro-log", "RETRO_LOG{}", "// Past Projects", "", 2, true),
            createSection(3, "modules-loaded", "MODULES_LOADED", "// Tech Stack", "", 3, true),
            createSection(4, "ux-lab", "UX.LAB{👾}", "// Design Zone", "", 4, true),
            createSection(5, "sys-sec-insights", "SYS_SEC::INSIGHTS", "// Cyber Logs", "", 5, true),
            createSection(6, "pipeline-workflow", "PIPELINE::WORKFLOW", "// DevOps & Agile", "", 6, true),
            createSection(7, "blog", "blog.txt", "// Thoughts & Posts", "", 7, true),
            createSection(8, "contact", "contact.txt", "// CV & Links", "", 8, true),
            createSection(9, "certs", "CERTS.log", "// Certificates & Courses", "", 9, true)
        );
        
        sectionRepository.saveAll(sections);
    }
    
    private Section createSection(int id, String slug, String title, String description, String content, int displayOrder, boolean published) {
        Section section = new Section();
        section.setSlug(slug);
        section.setTitle(title);
        section.setDescription(description);
        section.setContent(content);
        section.setDisplayOrder(displayOrder);
        section.setPublished(published);
        return section;
    }
}
