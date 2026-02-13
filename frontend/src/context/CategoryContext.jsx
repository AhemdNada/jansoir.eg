import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categoryApi, getImageUrl } from '../api/categoryApi';

const CategoryContext = createContext();

export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
};

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastStatus, setLastStatus] = useState(null);
    const [lastFetchedAt, setLastFetchedAt] = useState(0);
    const STALE_MS = 2 * 60 * 1000; // 2 minutes freshness window

    // Fetch all categories
    const fetchCategories = useCallback(async (status = null) => {
        try {
            setLoading(true);
            setError(null);
            setLastStatus(status);
            const response = await categoryApi.getCategories(status);
            setCategories(response.data || []);
            setLastFetchedAt(Date.now());
            return response.data;
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch categories:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get active categories only (for public views)
    const getActiveCategories = useCallback(() => {
        return categories.filter(cat => cat.status === 'Active');
    }, [categories]);

    // Create new category
    const createCategory = async (formData, token) => {
        try {
            setError(null);
            const response = await categoryApi.createCategory(formData, token);
            if (response.success) {
                setCategories(prev => [response.data, ...prev]);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Update category
    const updateCategory = async (id, formData, token) => {
        try {
            setError(null);
            const response = await categoryApi.updateCategory(id, formData, token);
            if (response.success) {
                setCategories(prev =>
                    prev.map(cat => cat._id === id ? response.data : cat)
                );
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Delete category
    const deleteCategory = async (id, token) => {
        try {
            setError(null);
            const response = await categoryApi.deleteCategory(id, token);
            if (response.success) {
                await fetchCategories(lastStatus);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Revalidate if stale (used on focus/critical flows)
    const ensureFreshCategories = useCallback(async () => {
        const now = Date.now();
        if (now - lastFetchedAt > STALE_MS) {
            await fetchCategories(lastStatus);
        }
    }, [fetchCategories, lastFetchedAt, lastStatus, STALE_MS]);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Revalidate on window focus
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                ensureFreshCategories();
            }
        };
        window.addEventListener('focus', ensureFreshCategories);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('focus', ensureFreshCategories);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [ensureFreshCategories]);

    const value = {
        categories,
        loading,
        error,
        fetchCategories,
        ensureFreshCategories,
        getActiveCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        getImageUrl
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

export default CategoryContext;
