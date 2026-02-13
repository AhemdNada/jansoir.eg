import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const couponApi = {
  // Admin
  getAll: async (token) => {
    const res = await fetch(`${API_BASE_URL}/coupons`, { headers: jsonHeaders(token) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch coupons');
    return data.data || [];
  },
  create: async (token, payload) => {
    const res = await fetch(`${API_BASE_URL}/coupons`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create coupon');
    return data.data;
  },
  update: async (token, id, payload) => {
    const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update coupon');
    return data.data;
  },
  remove: async (token, id) => {
    const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete coupon');
    return data;
  },

  // Client
  validate: async ({ code, subtotal }) => {
    const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid coupon');
    return data.data;
  },
};

