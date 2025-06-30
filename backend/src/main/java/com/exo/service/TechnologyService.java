package com.exo.service;

import com.exo.model.Technology;
import com.exo.repository.TechnologyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
public class TechnologyService {

    @Autowired
    private TechnologyRepository technologyRepository;

    public List<Technology> findAll() {
        return technologyRepository.findAll();
    }

    public Page<Technology> findAll(Pageable pageable) {
        return technologyRepository.findAll(pageable);
    }

    public Optional<Technology> findById(Long id) {
        return technologyRepository.findById(id);
    }

    public Technology save(Technology technology) {
        return technologyRepository.save(technology);
    }

    public void deleteById(Long id) {
        technologyRepository.deleteById(id);
    }

    public Page<Technology> findByNameContaining(String name, Pageable pageable) {
        return technologyRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    /* ==========================
     *        ICON MANAGEMENT
     * ==========================
     */

    public byte[] getIcon(Long technologyId) throws SQLException, IOException {
        Technology technology = technologyRepository.findById(technologyId).orElse(null);
        if (technology == null) {
            return null;
        }

        Blob iconBlob = technology.getIcon();

        if (iconBlob == null && technology.getIconString() != null) {
            try {
                iconBlob = technology.localImageToBlob(technology.getIconString(), "/assets/defaultProjectIcon.png");
                technology.setIcon(iconBlob);
                technologyRepository.save(technology);
            } catch (Exception ignored) {
                // If loading fails, we will return null later
            }
        }

        if (iconBlob != null) {
            return iconBlob.getBytes(1, (int) iconBlob.length());
        }
        return null;
    }

    @Transactional
    public Technology uploadIcon(Long technologyId, MultipartFile file) throws IOException, SQLException {
        Technology technology = technologyRepository.findById(technologyId).orElse(null);
        if (technology != null) {
            technology.setIcon(new javax.sql.rowset.serial.SerialBlob(file.getBytes()));
            technology.setIconString("/api/technologies/" + technologyId + "/icon");
            return technologyRepository.save(technology);
        }
        return null;
    }

    @Transactional
    public Technology updateIcon(Long technologyId, String imagePath) throws IOException, SQLException {
        Technology technology = technologyRepository.findById(technologyId).orElse(null);
        if (technology != null) {
            technology.setIconString(imagePath);
            technology.setIcon(technology.localImageToBlob(imagePath, "/assets/defaultProjectIcon.png"));
            return technologyRepository.save(technology);
        }
        return null;
    }

    public boolean existsById(Long id) {
        return technologyRepository.existsById(id);
    }

    public boolean existsByName(String name) {
        return technologyRepository.existsByNameIgnoreCase(name);
    }
}
