package com.exo.repository;

import com.exo.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Fetch a post by its unique slug
    Post findBySlug(String slug);

    // Search posts by title keyword (case-insensitive)
    List<Post> findByTitleContainingIgnoreCase(String keyword);

    // Get all published posts ordered by publication date desc
    List<Post> findByPublishedTrueOrderByPublishedAtDesc();
}
