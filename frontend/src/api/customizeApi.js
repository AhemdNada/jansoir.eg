import { API_BASE_URL } from './apiConfig';

export const customizeApi = {
  // Submit customize request
  submitCustomizeRequest: async (phoneNumber, description, size, photo, token) => {
    try {
      const formData = new FormData();
      formData.append('phoneNumber', phoneNumber);
      formData.append('description', description);
      formData.append('size', size);
      formData.append('photo', photo);

      const response = await fetch(`${API_BASE_URL}/customize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit customize request');
      }

      return data;
    } catch (error) {
      console.error('Error submitting customize request:', error);
      throw error;
    }
  },

  // Get user's customize requests (optional - for future use)
  getMyCustomizeRequests: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customize/my-requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customize requests');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customize requests:', error);
      throw error;
    }
  },

  // Admin: Get all customize requests
  getAllCustomizeRequests: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customize`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customize requests');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customize requests:', error);
      throw error;
    }
  },

  // Admin: Delete customize request
  deleteCustomizeRequest: async (id, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customize/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete customize request');
      }

      return data;
    } catch (error) {
      console.error('Error deleting customize request:', error);
      throw error;
    }
  }
};

