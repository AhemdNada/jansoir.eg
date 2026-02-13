import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const cartApi = {
  getCart: async (token) => {
    const res = await fetch(`${API_BASE_URL}/cart`, { headers: jsonHeaders(token) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
    return data.data || [];
  },
  replaceCart: async (items, token) => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save cart');
    return data.data || [];
  },
  addItem: async (item, token) => {
    const res = await fetch(`${API_BASE_URL}/cart/item`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add item');
    return data.data || [];
  },
  updateItem: async (payload, token) => {
    const res = await fetch(`${API_BASE_URL}/cart/item`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update item');
    return data.data || [];
  },
  removeItem: async (productId, size, color, token) => {
    const res = await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
      body: JSON.stringify({ size, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to remove item');
    return data.data || [];
  },
};

