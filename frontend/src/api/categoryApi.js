import { API_BASE_URL, SERVER_BASE_URL } from './apiConfig';

export const categoryApi = {
    // Get all categories
    getCategories: async (status = null) => {
        try {
            let url = `${API_BASE_URL}/categories`;
            if (status) {
                url += `?status=${status}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch categories');
            }

            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    // Get single category
    getCategory: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch category');
            }

            return data;
        } catch (error) {
            console.error('Error fetching category:', error);
            throw error;
        }
    },

    // Create category with image
    createCategory: async (formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                body: formData // Don't set Content-Type header, let browser set it with boundary
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create category');
            }

            return data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    // Update category
    updateCategory: async (id, formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'PUT',
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update category');
            }

            return data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    // Delete category
    deleteCategory: async (id, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete category');
            }

            return data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};

// Helper to get full image URL
const withUploadTransform = (absoluteUrl, opts = {}) => {
    const { w, format, q } = opts || {};
    if (!absoluteUrl || typeof absoluteUrl !== 'string') return absoluteUrl;
    if (!absoluteUrl.includes('/uploads/')) return absoluteUrl;
    if (w == null && format == null && q == null) return absoluteUrl;

    const url = new URL(absoluteUrl);
    if (w != null) url.searchParams.set('w', String(w));
    url.searchParams.set('format', String(format || 'webp'));
    url.searchParams.set('q', String(q || 75));
    return url.toString();
};

export const getImageUrl = (imagePath, opts) => {
    if (!imagePath) return null;
    const absolute = imagePath.startsWith('http') ? imagePath : `${SERVER_BASE_URL}${imagePath}`;
    return withUploadTransform(absolute, opts);
};
