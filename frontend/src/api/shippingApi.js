import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const shippingApi = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/shipping`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch shipping');
    return data.data || [];
  },
  create: async (token, payload) => {
    const res = await fetch(`${API_BASE_URL}/shipping`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create shipping');
    return data.data;
  },
  update: async (token, id, payload) => {
    const res = await fetch(`${API_BASE_URL}/shipping/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update shipping');
    return data.data;
  },
  bulkUpdate: async (token, updates) => {
    const res = await fetch(`${API_BASE_URL}/shipping/bulk`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to bulk update shipping');
    return data.data || [];
  },
};

