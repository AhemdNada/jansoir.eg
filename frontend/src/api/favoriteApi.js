import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const favoriteApi = {
  getFavorites: async (token) => {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: jsonHeaders(token),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch favorites');
    }
    return data;
  },

  addFavorite: async (productId, token) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
      method: 'POST',
      headers: jsonHeaders(token),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add favorite');
    }
    return data;
  },

  removeFavorite: async (productId, token) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove favorite');
    }
    return data;
  },
};

