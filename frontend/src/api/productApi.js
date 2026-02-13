import { API_BASE_URL, SERVER_BASE_URL, jsonHeaders } from './apiConfig';

export const productApi = {
    // Get all products with optional filters
    getProducts: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.page) params.append('page', filters.page);

            const queryString = params.toString();
            const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }

            return data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Search products (minimal fields)
    searchProducts: async ({ query, limit = 8, signal } = {}) => {
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (limit) params.append('limit', limit);

            const queryString = params.toString();
            const url = `${API_BASE_URL}/products/search${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, { signal });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search products');
            }

            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error searching products:', error);
            }
            throw error;
        }
    },

    // Get single product
    getProduct: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch product');
            }

            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    // Get products by category
    getProductsByCategory: async (categorySlug) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/category/${categorySlug}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }

            return data;
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    },

    // Create product with image
    createProduct: async (formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create product');
            }

            return data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    // Update product
    updateProduct: async (id, formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update product');
            }

            return data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    // Delete product
    deleteProduct: async (id, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete product');
            }

            return data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Add images to product
    addProductImages: async (id, formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/images`, {
                method: 'PUT',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add images');
            }

            return data;
        } catch (error) {
            console.error('Error adding product images:', error);
            throw error;
        }
    },

    // Delete product image by index
    deleteProductImage: async (id, imageIndex, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/images/${imageIndex}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete image');
            }

            return data;
        } catch (error) {
            console.error('Error deleting product image:', error);
            throw error;
        }
    },

    // Update product key features
    updateKeyFeatures: async (id, keyFeatures, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/key-features`, {
                method: 'PUT',
                headers: jsonHeaders(token),
                body: JSON.stringify({ keyFeatures })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update key features');
            }

            return data;
        } catch (error) {
            console.error('Error updating key features:', error);
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

export const getProductImageUrl = (imagePath, opts) => {
    if (!imagePath) return null;
    const absolute = imagePath.startsWith('http') ? imagePath : `${SERVER_BASE_URL}${imagePath}`;
    return withUploadTransform(absolute, opts);
};
