import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { favoriteApi } from '../api/favoriteApi';
import { useAuth } from './AuthContext';

const FavoriteContext = createContext();

export const useFavorites = () => {
  const ctx = useContext(FavoriteContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return ctx;
};

export const FavoriteProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();

  const favoriteIds = useMemo(() => new Set(favorites.map(f => (f.product?._id || f.product?.id || f.productId))), [favorites]);

  const fetchFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await favoriteApi.getFavorites(token);
      const data = (response?.data || []).map(fav => ({
        ...fav,
        productId: fav.product?._id || fav.product?.id,
      }));
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle redirect to login and store pending favorite intent
  const requireAuthForFavorite = useCallback((productId) => {
    const returnTo = location.pathname + location.search;
    sessionStorage.setItem('pendingFavoriteProductId', productId);
    sessionStorage.setItem('pendingFavoriteReturn', returnTo);
    navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }, [location.pathname, location.search, navigate]);

  const addFavorite = useCallback(async (product, productIdOverride) => {
    const productId = productIdOverride || product?.id || product?._id;
    if (!productId) return;
    if (!authed) {
      requireAuthForFavorite(productId);
      return;
    }

    // optimistic update if not already in list
    setFavorites(prev => {
      if (prev.some(f => f.productId === productId)) return prev;
      return [...prev, { product: product || null, productId }];
    });

    try {
      const response = await favoriteApi.addFavorite(productId, token);
      const newFav = {
        ...response.data,
        productId: response.data?.product?._id || productId,
      };
      setFavorites(prev => {
        const filtered = prev.filter(f => f.productId !== productId);
        return [...filtered, newFav];
      });
    } catch (err) {
      console.error('Add favorite failed:', err);
      setFavorites(prev => prev.filter(f => f.productId !== productId));
      setError(err.message);
    }
  }, [authed, requireAuthForFavorite, token]);

  const removeFavorite = useCallback(async (productId) => {
    if (!productId) return;
    if (!authed) {
      requireAuthForFavorite(productId);
      return;
    }

    const prev = favorites;
    setFavorites(curr => curr.filter(f => f.productId !== productId));
    try {
      await favoriteApi.removeFavorite(productId, token);
    } catch (err) {
      console.error('Remove favorite failed:', err);
      setFavorites(prev);
      setError(err.message);
    }
  }, [favorites, authed, requireAuthForFavorite, token]);

  const toggleFavorite = useCallback((product) => {
    const productId = product?.id || product?._id;
    if (!productId) return;
    if (favoriteIds.has(productId)) {
      removeFavorite(productId);
    } else {
      addFavorite(product);
    }
  }, [addFavorite, favoriteIds, removeFavorite]);

  const isFavorite = useCallback((productId) => favoriteIds.has(productId), [favoriteIds]);

  // Load favorites when token changes
  useEffect(() => {
    if (authed) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [authed, fetchFavorites]);

  // After login/register, auto-add pending favorite if exists
  useEffect(() => {
    if (!authed) return;
    const pendingId = sessionStorage.getItem('pendingFavoriteProductId');
    if (pendingId) {
      sessionStorage.removeItem('pendingFavoriteProductId');
      // preserve return path key but don't clear so login redirect works
      addFavorite(null, pendingId);
    }
  }, [addFavorite, authed]);

  const value = {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites: fetchFavorites,
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};

