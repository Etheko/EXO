import axios from 'axios';
import LoginService from './LoginService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = LoginService.getAccessToken();
        if (token && LoginService.isCurrentTokenValid()) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // If we get a 401 Unauthorized, the token might be expired
        if (error.response?.status === 401) {
            // Logout the user since we don't have refresh token implemented yet
            LoginService.performLogout();
        }
        
        return Promise.reject(error);
    }
);

export const testApi = {
    healthCheck: async () => {
        try {
            const response = await api.get('/test/health');
            return response.data;
        } catch (error) {
            console.error('Error checking backend health:', error);
            throw error;
        }
    }
};

export default api; 