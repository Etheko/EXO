import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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