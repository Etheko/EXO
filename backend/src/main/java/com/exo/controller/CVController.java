package com.exo.controller;

import com.exo.model.CV;
import com.exo.service.CVService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("/api/cvs")
@Tag(name = "CV Management", description = "APIs for managing CV/Resume files")
public class CVController {

    @Autowired
    private CVService cvService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @GetMapping
    @Operation(summary = "Get all CVs", description = "Retrieve a list of all CVs")
    public ResponseEntity<List<CV>> getAllCVs() {
        return ResponseEntity.ok(cvService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get CV by ID", description = "Retrieve a specific CV by its ID")
    public ResponseEntity<CV> getCVById(
            @Parameter(description = "CV ID") @PathVariable Long id) {
        return cvService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new CV", description = "Create a new CV")
    public ResponseEntity<CV> createCV(@RequestBody CV cv) {
        try {
            return ResponseEntity.ok(cvService.saveCV(cv));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update CV", description = "Update an existing CV")
    public ResponseEntity<CV> updateCV(
            @Parameter(description = "CV ID") @PathVariable Long id,
            @RequestBody CV cv) {
        return cvService.findById(id)
                .map(existingCV -> {
                    cv.setId(id);
                    try {
                        return ResponseEntity.ok(cvService.saveCV(cv));
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().<CV>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete CV", description = "Delete a CV by ID")
    public ResponseEntity<Void> deleteCV(
            @Parameter(description = "CV ID") @PathVariable Long id) {
        return cvService.findById(id)
                .map(cv -> {
                    cvService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* ==========================
     *      CV MANAGEMENT
     * ==========================
     */

    @PostMapping("/create")
    @Operation(summary = "Create CV with details", description = "Create a new CV with file details")
    public ResponseEntity<CV> createCVWithDetails(
            @Parameter(description = "CV title") @RequestParam String title,
            @Parameter(description = "File path") @RequestParam(required = false) String filePath,
            @Parameter(description = "File URL") @RequestParam(required = false) String fileUrl) {
        try {
            CV cv = cvService.createCV(title, filePath, fileUrl);
            return ResponseEntity.ok(cv);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/update")
    @Operation(summary = "Update CV with details", description = "Update an existing CV with file details")
    public ResponseEntity<CV> updateCVWithDetails(
            @Parameter(description = "CV ID") @PathVariable Long id,
            @Parameter(description = "CV title") @RequestParam String title,
            @Parameter(description = "File path") @RequestParam(required = false) String filePath,
            @Parameter(description = "File URL") @RequestParam(required = false) String fileUrl) {
        try {
            CV cv = cvService.updateCV(id, title, filePath, fileUrl);
            return cv != null ? ResponseEntity.ok(cv) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *      UTILITIES
     * ==========================
     */

    @GetMapping("/latest")
    @Operation(summary = "Get latest CV", description = "Retrieve the most recently uploaded CV")
    public ResponseEntity<CV> getLatestCV() {
        CV latestCV = cvService.getLatestCV();
        return latestCV != null ? ResponseEntity.ok(latestCV) : ResponseEntity.notFound().build();
    }

    @GetMapping("/has-active")
    @Operation(summary = "Check if active CV exists", description = "Check if there is an active CV available")
    public ResponseEntity<Boolean> hasActiveCV() {
        return ResponseEntity.ok(cvService.hasActiveCV());
    }

    @PutMapping("/{id}/file")
    @Operation(summary = "Update CV file", description = "Update just the PDF file of a CV")
    public ResponseEntity<CV> updateCVFile(
            @Parameter(description = "CV ID") @PathVariable Long id,
            @Parameter(description = "New file path") @RequestParam String newFilePath) {
        try {
            CV cv = cvService.updateCVFile(id, newFilePath);
            return cv != null ? ResponseEntity.ok(cv) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
