import axios from 'axios';

const BASE_URL = 'http://192.168.29.237:8083';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Users
  getUser: (id: string) => api.get(`/api/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/api/users/${id}`, data),
  
  // Inventory
  getEquipment: (params?: any) => api.get('/api/inventory/equipment', { params }),
  getServices: (params?: any) => api.get('/api/inventory/services', { params }),
  getVehicles: (params?: any) => api.get('/api/inventory/vehicles', { params }),
  getWorkerGroups: (params?: any) => api.get('/api/inventory/worker-groups', { params }),
  
  // Bookings
  createBooking: (data: any) => api.post('/api/bookings', data),
  getFarmerBookings: (farmerId: string) => api.get(`/api/bookings/farmer/${farmerId}`),
  getProviderBookings: (providerId: string) => api.get(`/api/bookings/provider/${providerId}`),
  
  // Notifications
  getNotifications: (userId: string) => api.get(`/api/notifications/user/${userId}`),
  markAsRead: (id: string) => api.put(`/api/notifications/${id}/read`),
};

export default api;
