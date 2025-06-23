package com.exo.service;

import com.exo.model.CV;
import com.exo.repository.CVRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
public class CVService {

    @Autowired
    private CVRepository cvRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public CV saveCV(CV cv) {
        return cvRepository.save(cv);
    }

    public Optional<CV> findById(Long id) {
        return cvRepository.findById(id);
    }

    public List<CV> findAll() {
        return cvRepository.findAll();
    }

    public void deleteById(Long id) {
        cvRepository.deleteById(id);
    }

    /* ==========================
     *      CV MANAGEMENT
     * ==========================
     */

    public CV createCV(String title, String filePath, String fileUrl) throws IOException, SQLException {
        CV cv = new CV(title, filePath, fileUrl);
        return cvRepository.save(cv);
    }

    public CV updateCV(Long id, String title, String filePath, String fileUrl) throws IOException, SQLException {
        Optional<CV> optional = cvRepository.findById(id);
        if (optional.isPresent()) {
            CV cv = optional.get();
            cv.setTitle(title);
            if (filePath != null && !filePath.isEmpty()) {
                cv.setFilePath(filePath);
                cv.setPdfBlob(cv.localFileToBlob(filePath));
            }
            cv.setFileUrl(fileUrl);
            return cvRepository.save(cv);
        }
        return null;
    }

    /* ==========================
     *      UTILITIES
     * ==========================
     */

    public CV getLatestCV() {
        return cvRepository.findTopByOrderByUploadedDateDesc();
    }

    public boolean hasActiveCV() {
        return cvRepository.findTopByOrderByUploadedDateDesc() != null;
    }

    public CV updateCVFile(Long id, String newFilePath) throws IOException, SQLException {
        Optional<CV> optional = cvRepository.findById(id);
        if (optional.isPresent()) {
            CV cv = optional.get();
            cv.setFilePath(newFilePath);
            cv.setPdfBlob(cv.localFileToBlob(newFilePath));
            return cvRepository.save(cv);
        }
        return null;
    }
}
