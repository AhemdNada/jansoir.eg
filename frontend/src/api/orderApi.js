import { API_BASE_URL, jsonHeaders } from './apiConfig';

export const orderApi = {
    createOrder: async (token, orderData) => {
        try {
            const formData = new FormData();
            // items must be serialized
            formData.append('items', JSON.stringify(orderData.items || []));
            formData.append('phone', orderData.phone);
            formData.append('address', orderData.address);
            formData.append('shippingGovernorateId', orderData.shippingGovernorateId);
            if (orderData.couponCode) {
                formData.append('couponCode', orderData.couponCode);
            }
            if (orderData.subtotal !== undefined) {
                formData.append('subtotal', orderData.subtotal);
            }
            formData.append('paymentMethod', orderData.paymentMethod);
            if (orderData.paymentReceiptFile) {
                formData.append('paymentReceipt', orderData.paymentReceiptFile);
            }

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create order');
            }
            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    getOrders: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: jsonHeaders(token)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }
            return data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    getOrder: async (token, id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                headers: jsonHeaders(token)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch order');
            }
            return data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    updateStatus: async (token, id, status, note = '') => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: jsonHeaders(token),
                body: JSON.stringify({ status, note })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update status');
            }
            return data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    updatePaymentStatus: async (token, id, paymentStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}/payment-status`, {
                method: 'PUT',
                headers: jsonHeaders(token),
                body: JSON.stringify({ paymentStatus })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update payment status');
            }
            return data;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    },

    deleteOrder: async (token, id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'DELETE',
                headers: jsonHeaders(token)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete order');
            }
            return data;
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }
};


