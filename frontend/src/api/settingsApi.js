import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const settingsApi = {
  getPaymentShipping: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/payment-shipping`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load settings');
    }
    return data.data;
  },

  updatePaymentShipping: async (token, payload) => {
    const response = await fetch(`${API_BASE_URL}/settings/payment-shipping`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update settings');
    }
    return data.data;
  }
};

