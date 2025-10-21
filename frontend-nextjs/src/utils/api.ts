import axios, { AxiosResponse } from 'axios';
import { MenuItem, Order, ApiResponse } from '@/types';

// API base URL - adjust based on your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle common error scenarios
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    throw error;
  }
);

// API service functions
export const apiService = {
  // Menu API
  async getMenu(): Promise<MenuItem[]> {
    try {
      // Fetch menu from local JSON file
      const response = await fetch('/menu.json');
      if (!response.ok) {
        throw new Error('Failed to fetch menu data');
      }
      
      const menuData = await response.json();
      
      // Transform the menu data structure to match MenuItem interface
      const menuItems: MenuItem[] = [];
      
      menuData.forEach((category: any) => {
        category.items.forEach((item: any) => {
          menuItems.push({
            _id: `${category.category.toLowerCase().replace(/\s+/g, '-')}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: item.name,
            description: item.description,
            price: item.price,
            category: category.category.toLowerCase().replace(/\s+/g, '-'),
            available: item.available,
            image: item.imageURL,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      });
      
      return menuItems;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw new Error('Failed to load menu items');
    }
  },

  // Order API
  async createOrder(orderData: {
    tableNumber: number;
    items: Array<{
      menuItem: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    customerNotes?: string;
  }): Promise<Order> {
    try {
      const response = await api.post<ApiResponse<Order>>('/api/orders', orderData);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create order');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to place order. Please try again.');
    }
  },

  async getOrder(orderNumber: string): Promise<Order> {
    try {
      const response = await api.get<ApiResponse<Order>>(`/api/orders/${orderNumber}`);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Order not found');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to load order details');
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await api.get<ApiResponse<Order[]>>('/api/orders');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to load orders');
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      const response = await api.patch<ApiResponse<Order>>(`/api/orders/${orderId}/status`, { status });
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update order status');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  },

  // QR Code API
  async generateQR(tableNumber: number): Promise<string> {
    try {
      const response = await api.post<{ qrCode: string }>('/api/qr/generate', { tableNumber });
      return response.data.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },
};

export default api;