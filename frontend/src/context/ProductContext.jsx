import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productApi, getProductImageUrl } from '../api/productApi';

const ProductContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });
    const [lastFilters, setLastFilters] = useState({});
    const [lastFetchedAt, setLastFetchedAt] = useState(0);
    const STALE_MS = 2 * 60 * 1000; // 2 minutes freshness window

    // Fetch all products
    const fetchProducts = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            setLastFilters(filters);
            const response = await productApi.getProducts(filters);
            setProducts(response.data || []);
            setPagination({
                page: response.page,
                totalPages: response.totalPages,
                total: response.total
            });
            setLastFetchedAt(Date.now());
            return response.data;
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch products:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Get active products only (for public views)
    const getActiveProducts = useCallback(() => {
        return products.filter(p => p.status === 'Active');
    }, [products]);

    // Get products by category
    const getProductsByCategory = useCallback((category) => {
        return products.filter(p => p.category === category && p.status === 'Active');
    }, [products]);

    // Revalidate if stale (used on focus/critical flows)
    const ensureFreshProducts = useCallback(async () => {
        const now = Date.now();
        if (now - lastFetchedAt > STALE_MS) {
            await fetchProducts(lastFilters);
        }
    }, [fetchProducts, lastFetchedAt, lastFilters, STALE_MS]);

    // Create new product
    const createProduct = async (formData, token) => {
        try {
            setError(null);
            const response = await productApi.createProduct(formData, token);
            if (response.success) {
                // Invalidate and refetch to keep cache aligned
                await fetchProducts(lastFilters);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Update product
    const updateProduct = async (id, formData, token) => {
        try {
            setError(null);
            const response = await productApi.updateProduct(id, formData, token);
            if (response.success) {
                await fetchProducts(lastFilters);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Delete product
    const deleteProduct = async (id, token) => {
        try {
            setError(null);
            const response = await productApi.deleteProduct(id, token);
            if (response.success) {
                await fetchProducts(lastFilters);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Optimistic local stock adjustments after checkout
    const applyLocalStockAdjustments = useCallback((orderItems = []) => {
        if (!orderItems.length) return;
        setProducts(prev =>
            prev.map(p => {
                const related = orderItems.filter(it => (it.productId || it.id) === p._id);
                if (related.length === 0) return p;

                if (Array.isArray(p.variants) && p.variants.length > 0) {
                    const updatedVariants = p.variants.map(v => ({ ...v }));
                    related.forEach(it => {
                        const size = it.size || '';
                        const color = it.color || '';
                        const qty = Number(it.quantity) || 0;
                        const idx = updatedVariants.findIndex(
                            v => (v.size || '') === size && (v.color || '') === color
                        );
                        if (idx >= 0) {
                            updatedVariants[idx].quantity = Math.max(
                                0,
                                (updatedVariants[idx].quantity || 0) - qty
                            );
                        }
                    });
                    return { ...p, variants: updatedVariants };
                }

                // Legacy fallback: no variants, reduce stock
                const legacyReduction = related.reduce(
                    (sum, it) => sum + (Number(it.quantity) || 0),
                    0
                );
                const legacyStock = Math.max(0, (p.stock || 0) - legacyReduction);
                return { ...p, stock: legacyStock };
            })
        );
    }, []);

    // Initial fetch
    useEffect(() => {
        // Avoid loading the entire catalog at once; fetch first page only.
        fetchProducts({ page: 1, limit: 50 });
    }, [fetchProducts]);

    // Revalidate on window focus to keep data fresh without excessive refetching
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                ensureFreshProducts();
            }
        };
        window.addEventListener('focus', ensureFreshProducts);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('focus', ensureFreshProducts);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [ensureFreshProducts]);

    const value = {
        products,
        loading,
        error,
        pagination,
        fetchProducts,
        ensureFreshProducts,
        getActiveProducts,
        getProductsByCategory,
        createProduct,
        updateProduct,
        deleteProduct,
        getProductImageUrl,
        applyLocalStockAdjustments
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

export default ProductContext;
