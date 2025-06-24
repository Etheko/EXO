package com.exo.service;

import com.exo.model.Section;
import com.exo.repository.SectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SectionService {

    @Autowired
    private SectionRepository sectionRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public Section saveSection(Section section) {
        return sectionRepository.save(section);
    }

    public Optional<Section> findById(Long id) {
        return sectionRepository.findById(id);
    }

    public List<Section> findAll() {
        return sectionRepository.findAll();
    }

    public void deleteById(Long id) {
        sectionRepository.deleteById(id);
    }

    /* ==========================
     *      SECTION MANAGEMENT
     * ==========================
     */

    public Section createSection(String slug, String title, String description, 
                                String content, Integer displayOrder, Boolean published, String componentType) {
        Section section = new Section();
        section.setSlug(slug);
        section.setTitle(title);
        section.setDescription(description);
        section.setContent(content);
        section.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        section.setPublished(published != null ? published : true);
        section.setComponentType(componentType);
        return sectionRepository.save(section);
    }

    public Section updateSection(Long id, String slug, String title, String description,
                                String content, Integer displayOrder, Boolean published, String componentType) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            if (slug != null) section.setSlug(slug);
            if (title != null) section.setTitle(title);
            if (description != null) section.setDescription(description);
            if (content != null) section.setContent(content);
            if (displayOrder != null) section.setDisplayOrder(displayOrder);
            if (published != null) section.setPublished(published);
            if (componentType != null) section.setComponentType(componentType);
            return sectionRepository.save(section);
        }
        return null;
    }

    /* ==========================
     *      PUBLICATION MANAGEMENT
     * ==========================
     */

    public Section publishSection(Long id) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setPublished(true);
            return sectionRepository.save(section);
        }
        return null;
    }

    public Section unpublishSection(Long id) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setPublished(false);
            return sectionRepository.save(section);
        }
        return null;
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    public Section findBySlug(String slug) {
        return sectionRepository.findBySlug(slug);
    }

    public List<Section> getPublishedSections() {
        return sectionRepository.findByPublishedTrueOrderByDisplayOrderAsc();
    }

    public List<Section> getDraftSections() {
        List<Section> allSections = sectionRepository.findAll();
        return allSections.stream()
                .filter(section -> !section.getPublished())
                .toList();
    }

    public List<Section> getAllSectionsOrdered() {
        List<Section> allSections = sectionRepository.findAll();
        return allSections.stream()
                .sorted((s1, s2) -> {
                    int order1 = s1.getDisplayOrder() != null ? s1.getDisplayOrder() : 0;
                    int order2 = s2.getDisplayOrder() != null ? s2.getDisplayOrder() : 0;
                    return Integer.compare(order1, order2);
                })
                .toList();
    }

    /* ==========================
     *      ORDERING MANAGEMENT
     * ==========================
     */

    public Section updateDisplayOrder(Long id, Integer newOrder) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setDisplayOrder(newOrder);
            return sectionRepository.save(section);
        }
        return null;
    }

    public List<Section> reorderSections(List<Long> sectionIds) {
        List<Section> sections = sectionRepository.findAllById(sectionIds);
        for (int i = 0; i < sections.size(); i++) {
            sections.get(i).setDisplayOrder(i);
        }
        return sectionRepository.saveAll(sections);
    }

    /* ==========================
     *      CONTENT MANAGEMENT
     * ==========================
     */

    public Section updateContent(Long id, String content) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setContent(content);
            return sectionRepository.save(section);
        }
        return null;
    }

    public Section updateTitle(Long id, String title) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setTitle(title);
            return sectionRepository.save(section);
        }
        return null;
    }

    public Section updateDescription(Long id, String description) {
        Optional<Section> optional = sectionRepository.findById(id);
        if (optional.isPresent()) {
            Section section = optional.get();
            section.setDescription(description);
            return sectionRepository.save(section);
        }
        return null;
    }
}
