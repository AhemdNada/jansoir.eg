import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const authApi = {
    // Register user
    register: async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register');
            }

            return data;
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to login');
            }

            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Get current user
    getMe: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: jsonHeaders(token)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user');
            }

            return data;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }
};

