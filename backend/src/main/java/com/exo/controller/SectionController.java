package com.exo.controller;

import com.exo.model.Section;
import com.exo.service.SectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@Tag(name = "Section Management", description = "APIs for managing portfolio sections")
public class SectionController {

    private static final Logger logger = LoggerFactory.getLogger(SectionController.class);

    @Autowired
    private SectionService sectionService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @GetMapping
    @Operation(summary = "Get all sections", description = "Retrieve a list of all sections")
    public ResponseEntity<List<Section>> getAllSections() {
        return ResponseEntity.ok(sectionService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get section by ID", description = "Retrieve a specific section by its ID")
    public ResponseEntity<Section> getSectionById(
            @Parameter(description = "Section ID") @PathVariable Long id) {
        return sectionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new section", description = "Create a new section (Admin only)")
    public ResponseEntity<Section> createSection(@RequestBody Section section) {
        return ResponseEntity.ok(sectionService.saveSection(section));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update section", description = "Update an existing section (Admin only)")
    public ResponseEntity<Section> updateSection(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @RequestBody Section section) {
        return sectionService.findById(id)
                .map(existingSection -> {
                    section.setId(id);
                    return ResponseEntity.ok(sectionService.saveSection(section));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete section", description = "Delete a section by ID (Admin only)")
    public ResponseEntity<Void> deleteSection(
            @Parameter(description = "Section ID") @PathVariable Long id) {
        return sectionService.findById(id)
                .map(section -> {
                    sectionService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* ==========================
     *      SECTION MANAGEMENT
     * ==========================
     */

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create section with details", description = "Create a new section with all details (Admin only)")
    public ResponseEntity<Section> createSectionWithDetails(
            @Parameter(description = "Section slug") @RequestParam String slug,
            @Parameter(description = "Section title") @RequestParam String title,
            @Parameter(description = "Section description") @RequestParam(required = false) String description,
            @Parameter(description = "Section content") @RequestParam String content,
            @Parameter(description = "Display order") @RequestParam(required = false) Integer displayOrder,
            @Parameter(description = "Published status") @RequestParam(defaultValue = "true") Boolean published,
            @Parameter(description = "Component type") @RequestParam(required = false) String componentType) {
        Section section = sectionService.createSection(slug, title, description, content, displayOrder, published, componentType);
        return ResponseEntity.ok(section);
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update section with details", description = "Update an existing section with all details (Admin only)")
    public ResponseEntity<Section> updateSectionWithDetails(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @Parameter(description = "Section slug") @RequestParam(required = false) String slug,
            @Parameter(description = "Section title") @RequestParam(required = false) String title,
            @Parameter(description = "Section description") @RequestParam(required = false) String description,
            @Parameter(description = "Section content") @RequestParam(required = false) String content,
            @Parameter(description = "Display order") @RequestParam(required = false) Integer displayOrder,
            @Parameter(description = "Published status") @RequestParam(required = false) Boolean published,
            @Parameter(description = "Component type") @RequestParam(required = false) String componentType) {
        Section section = sectionService.updateSection(id, slug, title, description, content, displayOrder, published, componentType);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      PUBLICATION MANAGEMENT
     * ==========================
     */

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publish section", description = "Publish a draft section (Admin only)")
    public ResponseEntity<Section> publishSection(
            @Parameter(description = "Section ID") @PathVariable Long id) {
        Section section = sectionService.publishSection(id);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Unpublish section", description = "Unpublish a published section (Admin only)")
    public ResponseEntity<Section> unpublishSection(
            @Parameter(description = "Section ID") @PathVariable Long id) {
        Section section = sectionService.unpublishSection(id);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get section by slug", description = "Retrieve a section by its unique slug")
    public ResponseEntity<Section> getSectionBySlug(
            @Parameter(description = "Section slug") @PathVariable String slug) {
        logger.info("Attempting to find section by slug: {}", slug);
        try {
            Section section = sectionService.findBySlug(slug);
            if (section != null) {
                logger.info("Found section with slug: {}. ID: {}", slug, section.getId());
                return ResponseEntity.ok(section);
            } else {
                logger.warn("No section found with slug: {}", slug);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error finding section by slug: " + slug, e);
            throw e; // Rethrow to let the default handler create the 500 response
        }
    }

    @GetMapping("/published")
    @Operation(summary = "Get published sections", description = "Retrieve all published sections ordered by display order")
    public ResponseEntity<List<Section>> getPublishedSections() {
        return ResponseEntity.ok(sectionService.getPublishedSections());
    }

    @GetMapping("/drafts")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get draft sections", description = "Retrieve all draft sections (Admin only)")
    public ResponseEntity<List<Section>> getDraftSections() {
        return ResponseEntity.ok(sectionService.getDraftSections());
    }

    @GetMapping("/ordered")
    @Operation(summary = "Get all sections ordered", description = "Retrieve all sections ordered by display order")
    public ResponseEntity<List<Section>> getAllSectionsOrdered() {
        return ResponseEntity.ok(sectionService.getAllSectionsOrdered());
    }

    /* ==========================
     *      ORDERING MANAGEMENT
     * ==========================
     */

    @PutMapping("/{id}/order")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update display order", description = "Update the display order of a section (Admin only)")
    public ResponseEntity<Section> updateDisplayOrder(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @Parameter(description = "New display order") @RequestParam Integer newOrder) {
        Section section = sectionService.updateDisplayOrder(id, newOrder);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reorder sections", description = "Reorder multiple sections by providing their IDs in the desired order (Admin only)")
    public ResponseEntity<List<Section>> reorderSections(
            @Parameter(description = "Section IDs in desired order") @RequestBody List<Long> sectionIds) {
        List<Section> sections = sectionService.reorderSections(sectionIds);
        return ResponseEntity.ok(sections);
    }

    /* ==========================
     *      CONTENT MANAGEMENT
     * ==========================
     */

    @PutMapping("/{id}/content")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update section content", description = "Update just the content of a section (Admin only)")
    public ResponseEntity<Section> updateContent(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @Parameter(description = "New content") @RequestParam String content) {
        Section section = sectionService.updateContent(id, content);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/title")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update section title", description = "Update just the title of a section (Admin only)")
    public ResponseEntity<Section> updateTitle(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @Parameter(description = "New title") @RequestParam String title) {
        Section section = sectionService.updateTitle(id, title);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/description")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update section description", description = "Update just the description of a section (Admin only)")
    public ResponseEntity<Section> updateDescription(
            @Parameter(description = "Section ID") @PathVariable Long id,
            @Parameter(description = "New description") @RequestParam String description) {
        Section section = sectionService.updateDescription(id, description);
        return section != null ? ResponseEntity.ok(section) : ResponseEntity.notFound().build();
    }
}
