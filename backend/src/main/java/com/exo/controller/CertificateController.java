package com.exo.controller;

import com.exo.model.Certificate;
import com.exo.service.CertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@Tag(name = "Certificate Management", description = "APIs for managing certificates")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @GetMapping
    @Operation(summary = "Get all certificates", description = "Retrieve a list of all certificates")
    public ResponseEntity<List<Certificate>> getAllCertificates() {
        return ResponseEntity.ok(certificateService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get certificate by ID", description = "Retrieve a specific certificate by its ID")
    public ResponseEntity<Certificate> getCertificateById(
            @Parameter(description = "Certificate ID") @PathVariable Long id) {
        return certificateService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new certificate", description = "Create a new certificate")
    public ResponseEntity<Certificate> createCertificate(@RequestBody Certificate certificate) {
        try {
            return ResponseEntity.ok(certificateService.saveCertificate(certificate));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update certificate", description = "Update an existing certificate")
    public ResponseEntity<Certificate> updateCertificate(
            @Parameter(description = "Certificate ID") @PathVariable Long id,
            @RequestBody Certificate certificate) {
        return certificateService.findById(id)
                .map(existingCertificate -> {
                    certificate.setId(id);
                    try {
                        return ResponseEntity.ok(certificateService.saveCertificate(certificate));
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().<Certificate>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete certificate", description = "Delete a certificate by ID")
    public ResponseEntity<Void> deleteCertificate(
            @Parameter(description = "Certificate ID") @PathVariable Long id) {
        return certificateService.findById(id)
                .map(certificate -> {
                    certificateService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    @GetMapping("/issuer/{issuer}")
    @Operation(summary = "Get certificates by issuer", description = "Find certificates issued by a specific organization")
    public ResponseEntity<List<Certificate>> getCertificatesByIssuer(
            @Parameter(description = "Issuing organization") @PathVariable String issuer) {
        return ResponseEntity.ok(certificateService.findByIssuer(issuer));
    }

    @GetMapping("/search")
    @Operation(summary = "Search certificates by title", description = "Search certificates by title keyword")
    public ResponseEntity<List<Certificate>> searchCertificatesByTitle(
            @Parameter(description = "Search keyword") @RequestParam String keyword) {
        return ResponseEntity.ok(certificateService.searchByTitle(keyword));
    }

    /* ==========================
     *      CERTIFICATE MANAGEMENT
     * ==========================
     */

    @PostMapping("/create")
    @Operation(summary = "Create certificate with details", description = "Create a new certificate with all details")
    public ResponseEntity<Certificate> createCertificateWithDetails(
            @Parameter(description = "Certificate title") @RequestParam String title,
            @Parameter(description = "Issuing organization") @RequestParam String issuer,
            @Parameter(description = "Issue date (YYYY-MM-DD)") @RequestParam(required = false) String issueDate,
            @Parameter(description = "Expiration date (YYYY-MM-DD)") @RequestParam(required = false) String expirationDate,
            @Parameter(description = "Credential ID") @RequestParam(required = false) String credentialId,
            @Parameter(description = "Verification URL") @RequestParam(required = false) String credentialUrl,
            @Parameter(description = "Certificate description") @RequestParam(required = false) String description,
            @Parameter(description = "Image path") @RequestParam(required = false) String imagePath) {
        try {
            LocalDate parsedIssueDate = issueDate != null ? LocalDate.parse(issueDate) : null;
            LocalDate parsedExpirationDate = expirationDate != null ? LocalDate.parse(expirationDate) : null;
            
            Certificate certificate = certificateService.createCertificate(
                    title, issuer, parsedIssueDate, parsedExpirationDate,
                    credentialId, credentialUrl, description, imagePath);
            return ResponseEntity.ok(certificate);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/update")
    @Operation(summary = "Update certificate with details", description = "Update an existing certificate with all details")
    public ResponseEntity<Certificate> updateCertificateWithDetails(
            @Parameter(description = "Certificate ID") @PathVariable Long id,
            @Parameter(description = "Certificate title") @RequestParam String title,
            @Parameter(description = "Issuing organization") @RequestParam String issuer,
            @Parameter(description = "Issue date (YYYY-MM-DD)") @RequestParam(required = false) String issueDate,
            @Parameter(description = "Expiration date (YYYY-MM-DD)") @RequestParam(required = false) String expirationDate,
            @Parameter(description = "Credential ID") @RequestParam(required = false) String credentialId,
            @Parameter(description = "Verification URL") @RequestParam(required = false) String credentialUrl,
            @Parameter(description = "Certificate description") @RequestParam(required = false) String description,
            @Parameter(description = "Image path") @RequestParam(required = false) String imagePath) {
        try {
            LocalDate parsedIssueDate = issueDate != null ? LocalDate.parse(issueDate) : null;
            LocalDate parsedExpirationDate = expirationDate != null ? LocalDate.parse(expirationDate) : null;
            
            Certificate certificate = certificateService.updateCertificate(
                    id, title, issuer, parsedIssueDate, parsedExpirationDate,
                    credentialId, credentialUrl, description, imagePath);
            return certificate != null ? ResponseEntity.ok(certificate) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *      VALIDATION & UTILITIES
     * ==========================
     */

    @GetMapping("/{id}/expired")
    @Operation(summary = "Check if certificate is expired", description = "Check if a specific certificate has expired")
    public ResponseEntity<Boolean> isCertificateExpired(
            @Parameter(description = "Certificate ID") @PathVariable Long id) {
        return ResponseEntity.ok(certificateService.isExpired(id));
    }

    @GetMapping("/expired")
    @Operation(summary = "Get expired certificates", description = "Retrieve all expired certificates")
    public ResponseEntity<List<Certificate>> getExpiredCertificates() {
        return ResponseEntity.ok(certificateService.getExpiredCertificates());
    }

    @GetMapping("/valid")
    @Operation(summary = "Get valid certificates", description = "Retrieve all valid (non-expired) certificates")
    public ResponseEntity<List<Certificate>> getValidCertificates() {
        return ResponseEntity.ok(certificateService.getValidCertificates());
    }
}
