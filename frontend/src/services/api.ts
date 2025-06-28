import axios from 'axios';
import LoginService from './LoginService';

// Function to determine the backend URL with a safe fallback for production
const getBackendUrl = () => {
    const envUrl = (import.meta as any).env.VITE_BACKEND_URL;
    if (envUrl) {
        return envUrl;
    }
    // If no env var, fallback based on dev/prod mode
    if ((import.meta as any).env.PROD) {
        // Fallback for production if the env var is missing
        console.warn("VITE_BACKEND_URL is not set. Falling back to production URL. Please set it in your Vercel project settings.");
        return 'https://exo-t74s.onrender.com';
    }
    return 'http://localhost:8080';
};

export const backendUrl = getBackendUrl();

const api = axios.create({
    baseURL: `${backendUrl}/api`,
    withCredentials: true,
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
            await LoginService.performLogout();
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