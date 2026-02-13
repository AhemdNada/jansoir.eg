import { API_BASE_URL, jsonHeaders } from './apiConfig';

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const analyticsApi = {
  overview: async ({ from, to }, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview${qs({ from, to })}`, {
      headers: jsonHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load analytics overview');
    return data.data;
  },

  topProducts: async ({ from, to, limit }, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/top-products${qs({ from, to, limit })}`, {
      headers: jsonHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load top products');
    return data.data;
  },

  clearAll: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/clear`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to clear analytics');
    return data.data;
  },

  deleteByRange: async ({ from, to }, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics${qs({ from, to })}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete analytics by range');
    return data.data;
  },
};

