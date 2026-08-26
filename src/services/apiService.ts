import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Users
  getUser: (id: string) => api.get(`/api/users/${id}`),
  getUserByPhone: (phoneNumber: string) => api.get(`/api/users/phone/${phoneNumber}`),
  getUserByEmail: (email: string) => api.get(`/api/users/email/${email}`),
  createUser: (data: any) => api.post('/api/users', data),
  updateUser: (id: string, data: any) => api.put(`/api/users/${id}`, data),
  
  // Inventory - Fetch
  getEquipment: (params?: any) => api.get('/api/inventory/equipment', { params }),
  getServices: (params?: any) => api.get('/api/inventory/services', { params }),
  getVehicles: (params?: any) => api.get('/api/inventory/vehicles', { params }),
  getWorkerGroups: (params?: any) => api.get('/api/inventory/worker-groups', { params }),
  getSkills: () => api.get('/api/inventory/skills'),
  createSkill: (data: { name: string }) => api.post('/api/inventory/skills', data),
  getVehicleCategories: () => api.get('/api/inventory/vehicle-categories'),
  createVehicleCategory: (data: { name: string }) => api.post('/api/inventory/vehicle-categories', data),
  
  // Inventory - Manage
  createEquipment: (data: any) => api.post('/api/inventory/equipment', data),
  createService: (data: any) => api.post('/api/inventory/services', data),
  createVehicle: (data: any) => api.post('/api/inventory/vehicles', data),
  createWorkerGroup: (data: any) => api.post('/api/inventory/worker-groups', data),

  deleteEquipment: (id: string) => api.delete(`/api/inventory/equipment/${id}`),
  deleteService: (id: string) => api.delete(`/api/inventory/services/${id}`),
  deleteVehicle: (id: string) => api.delete(`/api/inventory/vehicles/${id}`),
  deleteWorkerGroup: (id: string) => api.delete(`/api/inventory/worker-groups/${id}`),

  updateEquipment: (id: string, data: any) => api.put(`/api/inventory/equipment/${id}`, data),
  updateService: (id: string, data: any) => api.put(`/api/inventory/services/${id}`, data),
  updateVehicle: (id: string, data: any) => api.put(`/api/inventory/vehicles/${id}`, data),
  updateWorkerGroup: (id: string, data: any) => api.put(`/api/inventory/worker-groups/${id}`, data),
  
  // Bookings
  createBooking: (data: any) => api.post('/api/bookings', data),
  getFarmerBookings: (farmerId: string) => api.get(`/api/bookings/farmer/${farmerId}`),
  getProviderBookings: (providerId: string) => api.get(`/api/bookings/provider/${providerId}`),
  updateBookingStatus: (bookingId: string, status: string, cancelledBy?: string, cancellationReason?: string) => 
    api.put(`/api/bookings/${bookingId}/status`, null, { params: { status, cancelledBy, cancellationReason } }),
  markAllNotificationsAsRead: (userId: string) => api.put(`/api/notifications/user/${userId}/read-all`),
  
  // Notifications
  getNotifications: (userId: string) => api.get(`/api/notifications/user/${userId}`),
  markAsRead: (id: string) => api.put(`/api/notifications/${id}/read`),

  // Auth & Mobile OTP
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, role: string) => api.post('/api/auth/register', { email, password, role }),
  sendOtp: (email: string) => api.post('/api/auth/send-otp', { email }),
  verifyOtp: (email: string, otp: string) => api.post('/api/auth/verify-otp', { email, otp }),
  
  // Mobile Phone Authentication Endpoints (MSG91 & Static OTP)
  sendMsg91Otp: (phoneNumber: string) => api.post('/api/auth/msg91/send-otp', { phoneNumber }),
  verifyMsg91Otp: (data: { phoneNumber: string; otp: string; role?: string; fullName?: string; isLogin?: boolean }) =>
    api.post('/api/auth/msg91/verify-otp', data),
  staticLogin: (data: { phoneNumber: string; role?: string; fullName?: string; isLogin?: boolean }) =>
    api.post('/api/auth/static-login', data),

  // Image Helper
  getFullImageUrl: (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/api/')) return `${BASE_URL}${path}`;
    return `${BASE_URL}/api/media/download/${path}`;
  },

  // Media Upload
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Reviews
  submitReview: (reviewData: { bookingId: string, assetId: string, reviewerId: string, rating: number, comment?: string }) => 
    api.post('/api/reviews', reviewData),
  getAssetReviews: (assetId: string) => api.get(`/api/reviews/asset/${assetId}`),
};

export default api;

