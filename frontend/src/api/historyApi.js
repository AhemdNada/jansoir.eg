import { API_BASE_URL } from './apiConfig';

export const historyApi = {
    /**
     * Fetch activity history with pagination and filters.
     * @param {string} token
     * @param {{ page?: number, limit?: number, type?: string, search?: string }} params
     */
    getHistory: async (token, params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.type && params.type !== 'all') query.append('type', params.type);
        if (params.search) query.append('search', params.search);

        const response = await fetch(`${API_BASE_URL}/history?${query.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch activity history');
        }

        return data;
    },

    /**
     * Clear all activity history.
     * @param {string} token
     */
    clearAllHistory: async (token) => {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to clear activity history');
        }

        return data;
    }
};


