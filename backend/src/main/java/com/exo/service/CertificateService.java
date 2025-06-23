package com.exo.service;

import com.exo.model.Certificate;
import com.exo.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public Certificate saveCertificate(Certificate certificate) {
        return certificateRepository.save(certificate);
    }

    public Optional<Certificate> findById(Long id) {
        return certificateRepository.findById(id);
    }

    public List<Certificate> findAll() {
        return certificateRepository.findAll();
    }

    public void deleteById(Long id) {
        certificateRepository.deleteById(id);
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    public List<Certificate> findByIssuer(String issuer) {
        return certificateRepository.findByIssuer(issuer);
    }

    public List<Certificate> searchByTitle(String keyword) {
        return certificateRepository.findByTitleContainingIgnoreCase(keyword);
    }

    /* ==========================
     *      CERTIFICATE MANAGEMENT
     * ==========================
     */

    public Certificate createCertificate(String title, String issuer, LocalDate issueDate, 
                                       LocalDate expirationDate, String credentialId, 
                                       String credentialUrl, String description, String imagePath) 
            throws IOException, SQLException {
        Certificate certificate = new Certificate(title, issuer, issueDate, expirationDate, 
                                                credentialId, credentialUrl, description, imagePath);
        return certificateRepository.save(certificate);
    }

    public Certificate updateCertificate(Long id, String title, String issuer, LocalDate issueDate,
                                       LocalDate expirationDate, String credentialId,
                                       String credentialUrl, String description, String imagePath)
            throws IOException, SQLException {
        Optional<Certificate> optional = certificateRepository.findById(id);
        if (optional.isPresent()) {
            Certificate certificate = optional.get();
            certificate.setTitle(title);
            certificate.setIssuer(issuer);
            certificate.setIssueDate(issueDate);
            certificate.setExpirationDate(expirationDate);
            certificate.setCredentialId(credentialId);
            certificate.setCredentialUrl(credentialUrl);
            certificate.setDescription(description);
            if (imagePath != null && !imagePath.isEmpty()) {
                certificate.setImagePath(imagePath);
                certificate.setImageBlob(certificate.localImageToBlob(imagePath));
            }
            return certificateRepository.save(certificate);
        }
        return null;
    }

    /* ==========================
     *      VALIDATION & UTILITIES
     * ==========================
     */

    public boolean isExpired(Long certificateId) {
        Optional<Certificate> optional = certificateRepository.findById(certificateId);
        if (optional.isPresent()) {
            Certificate certificate = optional.get();
            LocalDate expirationDate = certificate.getExpirationDate();
            return expirationDate != null && expirationDate.isBefore(LocalDate.now());
        }
        return false;
    }

    public List<Certificate> getExpiredCertificates() {
        List<Certificate> allCertificates = certificateRepository.findAll();
        return allCertificates.stream()
                .filter(cert -> cert.getExpirationDate() != null && 
                               cert.getExpirationDate().isBefore(LocalDate.now()))
                .toList();
    }

    public List<Certificate> getValidCertificates() {
        List<Certificate> allCertificates = certificateRepository.findAll();
        return allCertificates.stream()
                .filter(cert -> cert.getExpirationDate() == null || 
                               cert.getExpirationDate().isAfter(LocalDate.now()))
                .toList();
    }
}
