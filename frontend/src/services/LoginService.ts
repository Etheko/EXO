import api from './api';

// Types for authentication
export interface LoginRequest {
    username: string;
    password: string;
}

export interface SignUpRequest {
    username: string;
    email: string;
    password: string;
    nick: string;
}

export interface JwtAuthenticationResponse {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

// In-memory storage for the access token to avoid XSS leakage via localStorage
let accessTokenMemory: string | null = null;

class LoginService {
    // Login user
    async login(credentials: LoginRequest): Promise<JwtAuthenticationResponse> {
        const response = await api.post<JwtAuthenticationResponse>('/auth/login', credentials);
        return response.data;
    }

    // Sign up new user (Admin only)
    async signup(userData: SignUpRequest): Promise<any> {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    }

    // Store tokens (access token only in memory; refresh token currently unused)
    storeTokens(accessToken: string, _refreshToken?: string): void {
        accessTokenMemory = accessToken;
    }

    // Get stored access token (from memory)
    getAccessToken(): string | null {
        return accessTokenMemory;
    }

    // Get stored refresh token (not stored client-side until refresh flow is implemented)
    getRefreshToken(): string | null {
        return null;
    }

    // Clear stored tokens
    clearTokens(): void {
        accessTokenMemory = null;
    }

    // Check if user is authenticated – simple runtime check
    isAuthenticated(): boolean {
        return accessTokenMemory !== null;
    }

    // Set authorization header for authenticated requests
    setAuthHeader(token: string): void {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Clear authorization header
    clearAuthHeader(): void {
        delete api.defaults.headers.common['Authorization'];
    }

    // Initialize auth header from stored token (only works during same page lifecycle)
    initializeAuthHeader(): void {
        if (accessTokenMemory) {
            this.setAuthHeader(accessTokenMemory);
        }
    }

    // Logout user
    logout(): void {
        this.clearTokens();
        this.clearAuthHeader();
        
        // Dispatch custom event for immediate UI updates
        window.dispatchEvent(new CustomEvent('loginStatusChanged', { 
            detail: { isAuthenticated: false } 
        }));
    }

    // Validate token format (basic validation)
    isValidTokenFormat(token: string): boolean {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // Basic JWT format validation (3 parts separated by dots)
        const parts = token.split('.');
        return parts.length === 3;
    }

    // Check if token is expired (basic check)
    isTokenExpired(token: string): boolean {
        if (!this.isValidTokenFormat(token)) {
            return true;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    // Get token expiration time
    getTokenExpiration(token: string): Date | null {
        if (!this.isValidTokenFormat(token)) {
            return null;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch (error) {
            return null;
        }
    }

    // Get user info from token
    getUserFromToken(token: string): any {
        if (!this.isValidTokenFormat(token)) {
            return null;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                username: payload.sub,
                roles: payload.roles || [],
                exp: payload.exp
            };
        } catch (error) {
            return null;
        }
    }

    // Complete login flow
    async performLogin(credentials: LoginRequest): Promise<boolean> {
        try {
            const response = await this.login(credentials);
            this.storeTokens(response.accessToken, response.refreshToken);
            this.setAuthHeader(response.accessToken);
            
            // Dispatch custom event for immediate UI updates
            window.dispatchEvent(new CustomEvent('loginStatusChanged', { 
                detail: { isAuthenticated: true } 
            }));
            
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }

    // Complete logout flow
    async performLogout(): Promise<void> {
        try {
            // Call backend to clear the HttpOnly cookie
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Backend logout failed:', error);
            // Continue with local cleanup even if backend call fails
        } finally {
            // Always clear local state
            this.logout();
        }
    }

    // Check if current token is valid and not expired
    isCurrentTokenValid(): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }
        return !this.isTokenExpired(token);
    }

    isCurrentUserAdmin(): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }
        const user = this.getUserFromToken(token);
        if (!user || !Array.isArray(user.roles)) return false;
        // eslint-disable-next-line prefer-nullish-coalescing
        return user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN');
    }

    // Refresh token (placeholder for future implementation)
    async refreshToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return false;
        }

        try {
            // Note: This endpoint doesn't exist yet in the backend
            // const response = await api.post<JwtAuthenticationResponse>('/auth/refresh', { refreshToken });
            // this.storeTokens(response.data.accessToken, response.data.refreshToken);
            // this.setAuthHeader(response.data.accessToken);
            // return true;
            
            // For now, return false as refresh endpoint is not implemented
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }
}

export default new LoginService();
