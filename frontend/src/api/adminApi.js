import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const adminApi = {
    // Get all admins
    getAdmins: async (token) => {
        const response = await fetch(`${API_BASE_URL}/admins`, {
            headers: jsonHeaders(token)
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch admins');
        }

        return data.data;
    },

    // Create a new admin
    createAdmin: async (payload, token) => {
        const response = await fetch(`${API_BASE_URL}/admins`, {
            method: 'POST',
            headers: jsonHeaders(token),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create admin');
        }

        return data.data;
    },

    // Update an admin
    updateAdmin: async (id, payload, token) => {
        const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
            method: 'PUT',
            headers: jsonHeaders(token),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update admin');
        }

        return data.data;
    },

    // Delete an admin
    deleteAdmin: async (id, token) => {
        const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
            method: 'DELETE',
            headers: jsonHeaders(token)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete admin');
        }

        return true;
    }
};


