package com.exo.controller;

import com.exo.model.Technology;
import com.exo.service.TechnologyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.net.URLConnection;
import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("/api/technologies")
@Tag(name = "Technology Management", description = "APIs for managing technologies")
public class TechnologyController {

    private static final Logger logger = LoggerFactory.getLogger(TechnologyController.class);

    @Autowired
    private TechnologyService technologyService;

    @GetMapping
    @Operation(summary = "Get all technologies", description = "Retrieve a list of all technologies with pagination")
    public ResponseEntity<Page<Technology>> getAllTechnologies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(technologyService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get technology by ID", description = "Retrieve a specific technology by its ID")
    public ResponseEntity<Technology> getTechnologyById(@PathVariable Long id) {
        return technologyService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new technology", description = "Create a new technology (Admin only)")
    public ResponseEntity<Technology> createTechnology(@RequestBody Technology technology) {
        return ResponseEntity.ok(technologyService.save(technology));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update technology", description = "Update an existing technology (Admin only)")
    public ResponseEntity<Technology> updateTechnology(@PathVariable Long id, @RequestBody Technology technologyDetails) {
        return technologyService.findById(id)
                .map(existingTechnology -> {
                    existingTechnology.setName(technologyDetails.getName());
                    existingTechnology.setDescription(technologyDetails.getDescription());
                    existingTechnology.setLink(technologyDetails.getLink());
                    existingTechnology.setCategory(technologyDetails.getCategory());
                    return ResponseEntity.ok(technologyService.save(existingTechnology));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete technology", description = "Delete a technology by ID (Admin only)")
    public ResponseEntity<Void> deleteTechnology(@PathVariable Long id) {
        return technologyService.findById(id)
                .map(technology -> {
                    technologyService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search technologies", description = "Search technologies by name")
    public ResponseEntity<Page<Technology>> searchTechnologies(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(technologyService.findByNameContaining(name, pageable));
    }

    /* ==========================
     *        ICON MANAGEMENT
     * ==========================
     */

    @GetMapping(path = "/{id}/icon")
    @Operation(summary = "Get technology icon", description = "Returns the technology's icon bytes")
    public ResponseEntity<byte[]> getTechnologyIcon(@PathVariable Long id) {
        try {
            byte[] bytes = technologyService.getIcon(id);

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
            logger.error("Error retrieving icon for technology id {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(path = "/{id}/icon", consumes = { "multipart/form-data" })
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload technology icon", description = "Uploads a new icon for the technology (Admin only)")
    public ResponseEntity<Technology> uploadTechnologyIcon(
            @PathVariable Long id,
            @RequestPart("icon") MultipartFile iconFile) {
        try {
            Technology updated = technologyService.uploadIcon(id, iconFile);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/icon-path")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update technology icon by path", description = "Updates the technology's icon by specifying an existing path (Admin only)")
    public ResponseEntity<Technology> updateTechnologyIcon(
            @PathVariable Long id,
            @RequestParam String imagePath) {
        try {
            Technology updated = technologyService.updateIcon(id, imagePath);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/exists/{id}")
    @Operation(summary = "Check if technology exists by ID", description = "Check if a technology with the given ID exists")
    public ResponseEntity<Boolean> technologyExists(@PathVariable Long id) {
        return ResponseEntity.ok(technologyService.existsById(id));
    }

    @GetMapping("/exists/name")
    @Operation(summary = "Check if technology name exists", description = "Check if a technology with the given name exists")
    public ResponseEntity<Boolean> technologyNameExists(@RequestParam String name) {
        return ResponseEntity.ok(technologyService.existsByName(name));
    }
}
