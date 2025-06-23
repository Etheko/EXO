package com.exo.repository;

import com.exo.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    // Find certificates by issuer (exact match)
    List<Certificate> findByIssuer(String issuer);

    // Case-insensitive search by title keyword(s)
    List<Certificate> findByTitleContainingIgnoreCase(String keyword);
}
