import api from './api';
import type { Post } from '../types/Post';

class PostService {
    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    // Get all posts
    async getAllPosts(): Promise<Post[]> {
        const response = await api.get<Post[]>('/posts');
        return response.data;
    }

    // Get a single post by ID
    async getPostById(id: number): Promise<Post> {
        const response = await api.get<Post>(`/posts/${id}`);
        return response.data;
    }

    // Create a new post
    async createPost(post: Post): Promise<Post> {
        const response = await api.post<Post>('/posts', post);
        return response.data;
    }

    // Update an existing post
    async updatePost(id: number, post: Post): Promise<Post> {
        const response = await api.put<Post>(`/posts/${id}`, post);
        return response.data;
    }

    // Delete a post
    async deletePost(id: number): Promise<void> {
        await api.delete(`/posts/${id}`);
    }

    /* ==========================
     *      BLOG MANAGEMENT
     * ==========================
     */

    // Create a post with details
    async createPostWithDetails(
        title: string,
        slug: string,
        content: string,
        authorUsername: string,
        excerpt?: string,
        coverImagePath?: string,
        tags?: string[],
        published: boolean = false
    ): Promise<Post> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('slug', slug);
        params.append('content', content);
        params.append('authorUsername', authorUsername);
        params.append('published', published.toString());
        if (excerpt) params.append('excerpt', excerpt);
        if (coverImagePath) params.append('coverImagePath', coverImagePath);
        if (tags && tags.length > 0) params.append('tags', tags.join(','));

        const response = await api.post<Post>(`/posts/create?${params.toString()}`);
        return response.data;
    }

    // Update a post with details
    async updatePostWithDetails(
        id: number,
        title: string,
        slug: string,
        content: string,
        excerpt?: string,
        coverImagePath?: string,
        tags?: string[],
        published: boolean = false
    ): Promise<Post> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('slug', slug);
        params.append('content', content);
        params.append('published', published.toString());
        if (excerpt) params.append('excerpt', excerpt);
        if (coverImagePath) params.append('coverImagePath', coverImagePath);
        if (tags && tags.length > 0) params.append('tags', tags.join(','));

        const response = await api.put<Post>(`/posts/${id}/update?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      PUBLICATION MANAGEMENT
     * ==========================
     */

    // Publish a post
    async publishPost(id: number): Promise<Post> {
        const response = await api.put<Post>(`/posts/${id}/publish`);
        return response.data;
    }

    // Unpublish a post
    async unpublishPost(id: number): Promise<Post> {
        const response = await api.put<Post>(`/posts/${id}/unpublish`);
        return response.data;
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    // Get post by slug
    async getPostBySlug(slug: string): Promise<Post> {
        const response = await api.get<Post>(`/posts/slug/${encodeURIComponent(slug)}`);
        return response.data;
    }

    // Search posts by title keyword
    async searchPostsByTitle(keyword: string): Promise<Post[]> {
        const response = await api.get<Post[]>(`/posts/search?keyword=${encodeURIComponent(keyword)}`);
        return response.data;
    }

    // Get published posts
    async getPublishedPosts(): Promise<Post[]> {
        const response = await api.get<Post[]>('/posts/published');
        return response.data;
    }

    // Get draft posts
    async getDraftPosts(): Promise<Post[]> {
        const response = await api.get<Post[]>('/posts/drafts');
        return response.data;
    }

    /* ==========================
     *      TAG MANAGEMENT
     * ==========================
     */

    // Add a tag to a post
    async addTag(id: number, tag: string): Promise<Post> {
        const params = new URLSearchParams();
        params.append('tag', tag);

        const response = await api.post<Post>(`/posts/${id}/tags?${params.toString()}`);
        return response.data;
    }

    // Remove a tag from a post
    async removeTag(id: number, tag: string): Promise<Post> {
        const params = new URLSearchParams();
        params.append('tag', tag);

        const response = await api.delete<Post>(`/posts/${id}/tags?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      GALLERY MANAGEMENT
     * ==========================
     */

    // Add image to gallery
    async addGalleryImage(id: number, imagePath: string): Promise<Post> {
        const params = new URLSearchParams();
        params.append('imagePath', imagePath);

        const response = await api.post<Post>(`/posts/${id}/gallery?${params.toString()}`);
        return response.data;
    }

    // Remove image from gallery
    async removeGalleryImage(id: number, index: number): Promise<Post> {
        const params = new URLSearchParams();
        params.append('index', index.toString());

        const response = await api.delete<Post>(`/posts/${id}/gallery?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      METRICS & ANALYTICS
     * ==========================
     */

    // Increment post views
    async incrementViews(id: number): Promise<Post> {
        const response = await api.post<Post>(`/posts/${id}/view`);
        return response.data;
    }

    // Increment post likes
    async incrementLikes(id: number): Promise<Post> {
        const response = await api.post<Post>(`/posts/${id}/like`);
        return response.data;
    }

    // Get most viewed posts
    async getMostViewedPosts(limit: number = 10): Promise<Post[]> {
        const response = await api.get<Post[]>(`/posts/popular/viewed?limit=${limit}`);
        return response.data;
    }

    // Get most liked posts
    async getMostLikedPosts(limit: number = 10): Promise<Post[]> {
        const response = await api.get<Post[]>(`/posts/popular/liked?limit=${limit}`);
        return response.data;
    }

    /* ==========================
     *      UTILITY METHODS
     * ==========================
     */

    // Check if a post is published
    isPostPublished(post: Post): boolean {
        return post.published === true;
    }

    // Check if a post is a draft
    isPostDraft(post: Post): boolean {
        return post.published === false;
    }

    // Format date for display
    formatDate(dateString?: string): string {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Format reading time
    formatReadingTime(minutes?: number): string {
        if (!minutes || minutes === 0) return 'N/A';
        
        if (minutes < 1) {
            return 'Less than 1 min read';
        } else if (minutes === 1) {
            return '1 min read';
        } else {
            return `${minutes} min read`;
        }
    }

    // Generate slug from title
    generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }

    // Get post status
    getPostStatus(post: Post): 'published' | 'draft' | 'unknown' {
        if (this.isPostPublished(post)) {
            return 'published';
        } else if (this.isPostDraft(post)) {
            return 'draft';
        } else {
            return 'unknown';
        }
    }

    // Filter posts by status
    filterPostsByStatus(posts: Post[], status: 'all' | 'published' | 'draft'): Post[] {
        switch (status) {
            case 'published':
                return posts.filter(post => this.isPostPublished(post));
            case 'draft':
                return posts.filter(post => this.isPostDraft(post));
            default:
                return posts;
        }
    }

    // Filter posts by tag
    filterPostsByTag(posts: Post[], tag: string): Post[] {
        const lowerTag = tag.toLowerCase();
        return posts.filter(post => 
            post.tags && post.tags.some(t => t.toLowerCase().includes(lowerTag))
        );
    }

    // Search posts by title, excerpt, or content
    searchPosts(posts: Post[], keyword: string): Post[] {
        const lowerKeyword = keyword.toLowerCase();
        return posts.filter(post => 
            post.title.toLowerCase().includes(lowerKeyword) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(lowerKeyword)) ||
            (post.content && post.content.toLowerCase().includes(lowerKeyword)) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
        );
    }

    // Sort posts by creation date (newest first)
    sortPostsByDate(posts: Post[]): Post[] {
        return [...posts].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Sort posts by publication date (newest first)
    sortPostsByPublicationDate(posts: Post[]): Post[] {
        return [...posts].sort((a, b) => {
            const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Sort posts by views (most viewed first)
    sortPostsByViews(posts: Post[]): Post[] {
        return [...posts].sort((a, b) => {
            const viewsA = a.views || 0;
            const viewsB = b.views || 0;
            return viewsB - viewsA;
        });
    }

    // Sort posts by likes (most liked first)
    sortPostsByLikes(posts: Post[]): Post[] {
        return [...posts].sort((a, b) => {
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            return likesB - likesA;
        });
    }

    // Get unique tags from posts
    getUniqueTags(posts: Post[]): string[] {
        const allTags = posts
            .flatMap(post => post.tags || [])
            .filter(tag => tag && tag.trim() !== '');
        return [...new Set(allTags)].sort();
    }

    // Get posts by author
    getPostsByAuthor(posts: Post[], authorUsername: string): Post[] {
        return posts.filter(post => 
            post.author && post.author.username === authorUsername
        );
    }

    // Get recent posts (last N days)
    getRecentPosts(posts: Post[], days: number = 30): Post[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return posts.filter(post => {
            if (!post.createdAt) return false;
            const postDate = new Date(post.createdAt);
            return postDate >= cutoffDate;
        });
    }

    // Calculate total views across all posts
    calculateTotalViews(posts: Post[]): number {
        return posts.reduce((total, post) => total + (post.views || 0), 0);
    }

    // Calculate total likes across all posts
    calculateTotalLikes(posts: Post[]): number {
        return posts.reduce((total, post) => total + (post.likes || 0), 0);
    }

    // Get average reading time
    getAverageReadingTime(posts: Post[]): number {
        const postsWithReadingTime = posts.filter(post => post.readingMinutes && post.readingMinutes > 0);
        if (postsWithReadingTime.length === 0) return 0;
        
        const totalMinutes = postsWithReadingTime.reduce((total, post) => total + (post.readingMinutes || 0), 0);
        return Math.round(totalMinutes / postsWithReadingTime.length);
    }

    // Get post excerpt (truncated content)
    getPostExcerpt(content: string, maxLength: number = 150): string {
        if (!content) return '';
        
        const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        if (plainText.length <= maxLength) return plainText;
        
        return plainText.substring(0, maxLength).trim() + '...';
    }

    // Validate slug format
    isValidSlug(slug: string): boolean {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug);
    }

    // Get post URL
    getPostUrl(post: Post): string {
        return `/blog/${post.slug}`;
    }
}

export default new PostService();
