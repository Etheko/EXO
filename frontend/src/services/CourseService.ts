import api from './api';
import type { Course } from '../types/Course';

class CourseService {
    /* ==========================
     *      BASIC CRUD
     * ==========================
     */

    // Get all courses
    async getAllCourses(): Promise<Course[]> {
        const response = await api.get<Course[]>('/courses');
        return response.data;
    }

    // Get a single course by ID
    async getCourseById(id: number): Promise<Course> {
        const response = await api.get<Course>(`/courses/${id}`);
        return response.data;
    }

    // Create a new course
    async createCourse(course: Course): Promise<Course> {
        const response = await api.post<Course>('/courses', course);
        return response.data;
    }

    // Update an existing course
    async updateCourse(id: number, course: Course): Promise<Course> {
        const response = await api.put<Course>(`/courses/${id}`, course);
        return response.data;
    }

    // Delete a course
    async deleteCourse(id: number): Promise<void> {
        await api.delete(`/courses/${id}`);
    }

    /* ==========================
     *      SEARCH & FILTER
     * ==========================
     */

    // Get courses by provider
    async getCoursesByProvider(provider: string): Promise<Course[]> {
        const response = await api.get<Course[]>(`/courses/provider/${encodeURIComponent(provider)}`);
        return response.data;
    }

    // Get courses by platform
    async getCoursesByPlatform(platform: string): Promise<Course[]> {
        const response = await api.get<Course[]>(`/courses/platform/${encodeURIComponent(platform)}`);
        return response.data;
    }

    // Search courses by title keyword
    async searchCoursesByTitle(keyword: string): Promise<Course[]> {
        const response = await api.get<Course[]>(`/courses/search?keyword=${encodeURIComponent(keyword)}`);
        return response.data;
    }

    /* ==========================
     *      COURSE MANAGEMENT
     * ==========================
     */

    // Create a course with details
    async createCourseWithDetails(
        title: string,
        provider: string,
        platform?: string,
        startDate?: string,
        completionDate?: string,
        durationHours?: number,
        description?: string,
        courseUrl?: string,
        imagePath?: string,
        topics?: string[]
    ): Promise<Course> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('provider', provider);
        if (platform) params.append('platform', platform);
        if (startDate) params.append('startDate', startDate);
        if (completionDate) params.append('completionDate', completionDate);
        if (durationHours !== undefined) params.append('durationHours', durationHours.toString());
        if (description) params.append('description', description);
        if (courseUrl) params.append('courseUrl', courseUrl);
        if (imagePath) params.append('imagePath', imagePath);
        if (topics && topics.length > 0) params.append('topics', topics.join(','));

        const response = await api.post<Course>(`/courses/create?${params.toString()}`);
        return response.data;
    }

    // Update a course with details
    async updateCourseWithDetails(
        id: number,
        title: string,
        provider: string,
        platform?: string,
        startDate?: string,
        completionDate?: string,
        durationHours?: number,
        description?: string,
        courseUrl?: string,
        imagePath?: string,
        topics?: string[]
    ): Promise<Course> {
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('provider', provider);
        if (platform) params.append('platform', platform);
        if (startDate) params.append('startDate', startDate);
        if (completionDate) params.append('completionDate', completionDate);
        if (durationHours !== undefined) params.append('durationHours', durationHours.toString());
        if (description) params.append('description', description);
        if (courseUrl) params.append('courseUrl', courseUrl);
        if (imagePath) params.append('imagePath', imagePath);
        if (topics && topics.length > 0) params.append('topics', topics.join(','));

        const response = await api.put<Course>(`/courses/${id}/update?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      TOPIC MANAGEMENT
     * ==========================
     */

    // Add a topic to a course
    async addTopic(id: number, topic: string): Promise<Course> {
        const params = new URLSearchParams();
        params.append('topic', topic);

        const response = await api.post<Course>(`/courses/${id}/topics?${params.toString()}`);
        return response.data;
    }

    // Remove a topic from a course
    async removeTopic(id: number, topic: string): Promise<Course> {
        const params = new URLSearchParams();
        params.append('topic', topic);

        const response = await api.delete<Course>(`/courses/${id}/topics?${params.toString()}`);
        return response.data;
    }

    /* ==========================
     *      ANALYTICS & UTILITIES
     * ==========================
     */

    // Get completed courses
    async getCompletedCourses(): Promise<Course[]> {
        const response = await api.get<Course[]>('/courses/completed');
        return response.data;
    }

    // Get in-progress courses
    async getInProgressCourses(): Promise<Course[]> {
        const response = await api.get<Course[]>('/courses/in-progress');
        return response.data;
    }

    // Get total study hours
    async getTotalStudyHours(): Promise<number> {
        const response = await api.get<number>('/courses/total-hours');
        return response.data;
    }

    // Get courses by duration range
    async getCoursesByDurationRange(minHours: number, maxHours: number): Promise<Course[]> {
        const response = await api.get<Course[]>(`/courses/duration-range?minHours=${minHours}&maxHours=${maxHours}`);
        return response.data;
    }

    /* ==========================
     *      UTILITY METHODS
     * ==========================
     */

    // Check if a course is completed
    isCourseCompleted(course: Course): boolean {
        return !!(course.completionDate);
    }

    // Check if a course is in progress
    isCourseInProgress(course: Course): boolean {
        return !!(course.startDate && !course.completionDate);
    }

    // Check if a course is planned (not started)
    isCoursePlanned(course: Course): boolean {
        return !!(course.startDate && new Date(course.startDate) > new Date());
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

    // Format duration in hours
    formatDuration(hours?: number): string {
        if (!hours || hours === 0) return 'N/A';
        
        if (hours < 1) {
            return `${Math.round(hours * 60)} minutes`;
        } else if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'}`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days} day${days === 1 ? '' : 's'}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
        }
    }

    // Get course status
    getCourseStatus(course: Course): 'completed' | 'in-progress' | 'planned' | 'unknown' {
        if (this.isCourseCompleted(course)) {
            return 'completed';
        } else if (this.isCourseInProgress(course)) {
            return 'in-progress';
        } else if (this.isCoursePlanned(course)) {
            return 'planned';
        } else {
            return 'unknown';
        }
    }

    // Get course progress percentage
    getCourseProgress(course: Course): number {
        if (this.isCourseCompleted(course)) {
            return 100;
        } else if (this.isCourseInProgress(course) && course.startDate) {
            const startDate = new Date(course.startDate);
            const currentDate = new Date();
            const totalDays = course.durationHours ? course.durationHours / 24 : 30; // Assume 30 days if no duration
            const elapsedDays = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 99);
            return Math.round(progress);
        } else {
            return 0;
        }
    }

    // Filter courses by status
    filterCoursesByStatus(courses: Course[], status: 'all' | 'completed' | 'in-progress' | 'planned'): Course[] {
        switch (status) {
            case 'completed':
                return courses.filter(course => this.isCourseCompleted(course));
            case 'in-progress':
                return courses.filter(course => this.isCourseInProgress(course));
            case 'planned':
                return courses.filter(course => this.isCoursePlanned(course));
            default:
                return courses;
        }
    }

    // Filter courses by provider
    filterCoursesByProvider(courses: Course[], provider: string): Course[] {
        return courses.filter(course => 
            course.provider.toLowerCase().includes(provider.toLowerCase())
        );
    }

    // Filter courses by platform
    filterCoursesByPlatform(courses: Course[], platform: string): Course[] {
        return courses.filter(course => 
            course.platform && course.platform.toLowerCase().includes(platform.toLowerCase())
        );
    }

    // Search courses by title or description
    searchCourses(courses: Course[], keyword: string): Course[] {
        const lowerKeyword = keyword.toLowerCase();
        return courses.filter(course => 
            course.title.toLowerCase().includes(lowerKeyword) ||
            (course.description && course.description.toLowerCase().includes(lowerKeyword)) ||
            (course.topics && course.topics.some(topic => topic.toLowerCase().includes(lowerKeyword)))
        );
    }

    // Sort courses by completion date (newest first)
    sortCoursesByCompletionDate(courses: Course[]): Course[] {
        return [...courses].sort((a, b) => {
            const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
            const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Sort courses by start date (newest first)
    sortCoursesByStartDate(courses: Course[]): Course[] {
        return [...courses].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Sort courses by duration (longest first)
    sortCoursesByDuration(courses: Course[]): Course[] {
        return [...courses].sort((a, b) => {
            const durationA = a.durationHours || 0;
            const durationB = b.durationHours || 0;
            return durationB - durationA;
        });
    }

    // Calculate total duration of courses
    calculateTotalDuration(courses: Course[]): number {
        return courses.reduce((total, course) => total + (course.durationHours || 0), 0);
    }

    // Get unique providers from courses
    getUniqueProviders(courses: Course[]): string[] {
        const providers = courses.map(course => course.provider);
        return [...new Set(providers)].sort();
    }

    // Get unique platforms from courses
    getUniquePlatforms(courses: Course[]): string[] {
        const platforms = courses
            .map(course => course.platform)
            .filter((platform): platform is string => platform !== undefined && platform.trim() !== '');
        return [...new Set(platforms)].sort();
    }

    // Get all unique topics from courses
    getAllUniqueTopics(courses: Course[]): string[] {
        const allTopics = courses
            .flatMap(course => course.topics || [])
            .filter(topic => topic && topic.trim() !== '');
        return [...new Set(allTopics)].sort();
    }
}

export default new CourseService();
