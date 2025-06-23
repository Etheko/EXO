package com.exo.service;

import com.exo.model.Post;
import com.exo.model.User;
import com.exo.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    public Post savePost(Post post) {
        return postRepository.save(post);
    }

    public Optional<Post> findById(Long id) {
        return postRepository.findById(id);
    }

    public List<Post> findAll() {
        return postRepository.findAll();
    }

    public void deleteById(Long id) {
        postRepository.deleteById(id);
    }

    /* ==========================
     *      BLOG MANAGEMENT
     * ==========================
     */

    public Post createPost(String title, String slug, String excerpt, String content,
                          String coverImagePath, List<String> tags, boolean published, User author)
            throws IOException, SQLException {
        Post post = new Post(title, slug, excerpt, content, coverImagePath, tags, published, author);
        return postRepository.save(post);
    }

    public Post updatePost(Long id, String title, String slug, String excerpt, String content,
                          String coverImagePath, List<String> tags, boolean published)
            throws IOException, SQLException {
        Optional<Post> optional = postRepository.findById(id);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.setTitle(title);
            post.setSlug(slug);
            post.setExcerpt(excerpt);
            post.setContent(content);
            if (coverImagePath != null && !coverImagePath.isEmpty()) {
                post.setCoverImagePath(coverImagePath);
                post.setCoverImageBlob(post.localImageToBlob(coverImagePath));
            }
            if (tags != null) post.setTags(tags);
            post.setPublished(published);
            if (published && post.getPublishedAt() == null) {
                post.setPublishedAt(LocalDateTime.now());
            }
            // Calculate reading minutes directly
            int readingMinutes = calculateReadingMinutes(content);
            post.setReadingMinutes(readingMinutes);
            return postRepository.save(post);
        }
        return null;
    }

    /* ==========================
     *      PUBLICATION MANAGEMENT
     * ==========================
     */

    public Post publishPost(Long id) {
        Optional<Post> optional = postRepository.findById(id);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.setPublished(true);
            if (post.getPublishedAt() == null) {
                post.setPublishedAt(LocalDateTime.now());
            }
            return postRepository.save(post);
        }
        return null;
    }

    public Post unpublishPost(Long id) {
        Optional<Post> optional = postRepository.findById(id);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.setPublished(false);
            return postRepository.save(post);
        }
        return null;
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    public Post findBySlug(String slug) {
        return postRepository.findBySlug(slug);
    }

    public List<Post> searchByTitle(String keyword) {
        return postRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public List<Post> getPublishedPosts() {
        return postRepository.findByPublishedTrueOrderByPublishedAtDesc();
    }

    public List<Post> getDraftPosts() {
        List<Post> allPosts = postRepository.findAll();
        return allPosts.stream()
                .filter(post -> !post.isPublished())
                .toList();
    }

    /* ==========================
     *      TAG MANAGEMENT
     * ==========================
     */

    public Post addTag(Long postId, String tag) {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.addTag(tag);
            return postRepository.save(post);
        }
        return null;
    }

    public Post removeTag(Long postId, String tag) {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.removeTag(tag);
            return postRepository.save(post);
        }
        return null;
    }

    /* ==========================
     *      GALLERY MANAGEMENT
     * ==========================
     */

    public Post addGalleryImage(Long postId, String imagePath) throws IOException, SQLException {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.addGalleryImage(imagePath);
            return postRepository.save(post);
        }
        return null;
    }

    public Post removeGalleryImage(Long postId, int index) {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.removeGalleryImage(index);
            return postRepository.save(post);
        }
        return null;
    }

    /* ==========================
     *      METRICS & ANALYTICS
     * ==========================
     */

    public Post incrementViews(Long postId) {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.incrementViews();
            return postRepository.save(post);
        }
        return null;
    }

    public Post incrementLikes(Long postId) {
        Optional<Post> optional = postRepository.findById(postId);
        if (optional.isPresent()) {
            Post post = optional.get();
            post.incrementLikes();
            return postRepository.save(post);
        }
        return null;
    }

    public List<Post> getMostViewedPosts(int limit) {
        List<Post> publishedPosts = getPublishedPosts();
        return publishedPosts.stream()
                .sorted((p1, p2) -> Integer.compare(p2.getViews(), p1.getViews()))
                .limit(limit)
                .toList();
    }

    public List<Post> getMostLikedPosts(int limit) {
        List<Post> publishedPosts = getPublishedPosts();
        return publishedPosts.stream()
                .sorted((p1, p2) -> Integer.compare(p2.getLikes(), p1.getLikes()))
                .limit(limit)
                .toList();
    }

    /* ==========================
     *      UTILITIES
     * ==========================
     */

    private int calculateReadingMinutes(String text) {
        if (text == null || text.isBlank()) return 0;
        int words = text.trim().split("\\s+").length;
        return Math.max(1, words / 200); // Roughly 200 wpm
    }
}
