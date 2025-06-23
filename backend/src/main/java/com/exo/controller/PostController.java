package com.exo.controller;

import com.exo.model.Post;
import com.exo.model.User;
import com.exo.service.PostService;
import com.exo.service.UserService;
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
@RequestMapping("/api/posts")
@Tag(name = "Blog Post Management", description = "APIs for managing blog posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    @GetMapping
    @Operation(summary = "Get all posts", description = "Retrieve a list of all posts")
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get post by ID", description = "Retrieve a specific post by its ID")
    public ResponseEntity<Post> getPostById(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        return postService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new post", description = "Create a new blog post")
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        try {
            return ResponseEntity.ok(postService.savePost(post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update post", description = "Update an existing blog post")
    public ResponseEntity<Post> updatePost(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @RequestBody Post post) {
        return postService.findById(id)
                .map(existingPost -> {
                    post.setId(id);
                    try {
                        return ResponseEntity.ok(postService.savePost(post));
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().<Post>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete post", description = "Delete a blog post by ID")
    public ResponseEntity<Void> deletePost(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        return postService.findById(id)
                .map(post -> {
                    postService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* ==========================
     *      BLOG MANAGEMENT
     * ==========================
     */

    @PostMapping("/create")
    @Operation(summary = "Create post with details", description = "Create a new blog post with all details")
    public ResponseEntity<Post> createPostWithDetails(
            @Parameter(description = "Post title") @RequestParam String title,
            @Parameter(description = "Post slug") @RequestParam String slug,
            @Parameter(description = "Post excerpt") @RequestParam(required = false) String excerpt,
            @Parameter(description = "Post content") @RequestParam String content,
            @Parameter(description = "Cover image path") @RequestParam(required = false) String coverImagePath,
            @Parameter(description = "Tags (comma-separated)") @RequestParam(required = false) String tags,
            @Parameter(description = "Published status") @RequestParam(defaultValue = "false") boolean published,
            @Parameter(description = "Author username") @RequestParam String authorUsername) {
        try {
            User author = userService.findByUsername(authorUsername).orElse(null);
            if (author == null) {
                return ResponseEntity.badRequest().build();
            }

            List<String> tagsList = null;
            if (tags != null && !tags.isEmpty()) {
                tagsList = List.of(tags.split(","));
            }

            Post post = postService.createPost(
                    title, slug, excerpt, content, coverImagePath, tagsList, published, author);
            return ResponseEntity.ok(post);
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/update")
    @Operation(summary = "Update post with details", description = "Update an existing blog post with all details")
    public ResponseEntity<Post> updatePostWithDetails(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @Parameter(description = "Post title") @RequestParam String title,
            @Parameter(description = "Post slug") @RequestParam String slug,
            @Parameter(description = "Post excerpt") @RequestParam(required = false) String excerpt,
            @Parameter(description = "Post content") @RequestParam String content,
            @Parameter(description = "Cover image path") @RequestParam(required = false) String coverImagePath,
            @Parameter(description = "Tags (comma-separated)") @RequestParam(required = false) String tags,
            @Parameter(description = "Published status") @RequestParam boolean published) {
        try {
            List<String> tagsList = null;
            if (tags != null && !tags.isEmpty()) {
                tagsList = List.of(tags.split(","));
            }

            Post post = postService.updatePost(
                    id, title, slug, excerpt, content, coverImagePath, tagsList, published);
            return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /* ==========================
     *      PUBLICATION MANAGEMENT
     * ==========================
     */

    @PutMapping("/{id}/publish")
    @Operation(summary = "Publish post", description = "Publish a draft post")
    public ResponseEntity<Post> publishPost(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        Post post = postService.publishPost(id);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish post", description = "Unpublish a published post")
    public ResponseEntity<Post> unpublishPost(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        Post post = postService.unpublishPost(id);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get post by slug", description = "Retrieve a post by its unique slug")
    public ResponseEntity<Post> getPostBySlug(
            @Parameter(description = "Post slug") @PathVariable String slug) {
        Post post = postService.findBySlug(slug);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search posts by title", description = "Search posts by title keyword")
    public ResponseEntity<List<Post>> searchPostsByTitle(
            @Parameter(description = "Search keyword") @RequestParam String keyword) {
        return ResponseEntity.ok(postService.searchByTitle(keyword));
    }

    @GetMapping("/published")
    @Operation(summary = "Get published posts", description = "Retrieve all published posts")
    public ResponseEntity<List<Post>> getPublishedPosts() {
        return ResponseEntity.ok(postService.getPublishedPosts());
    }

    @GetMapping("/drafts")
    @Operation(summary = "Get draft posts", description = "Retrieve all draft posts")
    public ResponseEntity<List<Post>> getDraftPosts() {
        return ResponseEntity.ok(postService.getDraftPosts());
    }

    /* ==========================
     *      TAG MANAGEMENT
     * ==========================
     */

    @PostMapping("/{id}/tags")
    @Operation(summary = "Add tag to post", description = "Add a new tag to a post")
    public ResponseEntity<Post> addTag(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @Parameter(description = "Tag to add") @RequestParam String tag) {
        Post post = postService.addTag(id, tag);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}/tags")
    @Operation(summary = "Remove tag from post", description = "Remove a tag from a post")
    public ResponseEntity<Post> removeTag(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @Parameter(description = "Tag to remove") @RequestParam String tag) {
        Post post = postService.removeTag(id, tag);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      GALLERY MANAGEMENT
     * ==========================
     */

    @PostMapping("/{id}/gallery")
    @Operation(summary = "Add image to gallery", description = "Add an image to the post gallery")
    public ResponseEntity<Post> addGalleryImage(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @Parameter(description = "Image path") @RequestParam String imagePath) {
        try {
            Post post = postService.addGalleryImage(id, imagePath);
            return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
        } catch (IOException | SQLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}/gallery")
    @Operation(summary = "Remove image from gallery", description = "Remove an image from the post gallery")
    public ResponseEntity<Post> removeGalleryImage(
            @Parameter(description = "Post ID") @PathVariable Long id,
            @Parameter(description = "Image index") @RequestParam int index) {
        Post post = postService.removeGalleryImage(id, index);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    /* ==========================
     *      METRICS & ANALYTICS
     * ==========================
     */

    @PostMapping("/{id}/view")
    @Operation(summary = "Increment post views", description = "Increment the view count for a post")
    public ResponseEntity<Post> incrementViews(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        Post post = postService.incrementViews(id);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Increment post likes", description = "Increment the like count for a post")
    public ResponseEntity<Post> incrementLikes(
            @Parameter(description = "Post ID") @PathVariable Long id) {
        Post post = postService.incrementLikes(id);
        return post != null ? ResponseEntity.ok(post) : ResponseEntity.notFound().build();
    }

    @GetMapping("/popular/viewed")
    @Operation(summary = "Get most viewed posts", description = "Retrieve the most viewed posts")
    public ResponseEntity<List<Post>> getMostViewedPosts(
            @Parameter(description = "Number of posts to retrieve") @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(postService.getMostViewedPosts(limit));
    }

    @GetMapping("/popular/liked")
    @Operation(summary = "Get most liked posts", description = "Retrieve the most liked posts")
    public ResponseEntity<List<Post>> getMostLikedPosts(
            @Parameter(description = "Number of posts to retrieve") @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(postService.getMostLikedPosts(limit));
    }
}
