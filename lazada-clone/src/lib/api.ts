import axios from 'axios';

// Use main server API (BVA Server) instead of local backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  if ((config.method || 'get').toLowerCase() === 'get') {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (unauthorized) - clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token on 401
      localStorage.removeItem('token');
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // Store current path for redirect after login
        const currentPath = window.location.pathname;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const productAPI = {
  getAll: (params?: any) => api.get('/products', { params: { ...params, platform: 'LAZADA' } }),
  getById: (id: string) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured', { params: { platform: 'LAZADA' } }),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (data: any) => api.post('/cart/add', data),
  removeItem: (productId: string) => api.post('/cart/remove', { productId }),
  updateItem: (productId: string, quantity: number) => 
    api.put('/cart/update', { productId, quantity }),
  clearCart: () => api.delete('/cart/clear'),
};

export const orderAPI = {
  // Buyer endpoints (for lazada-clone buyers)
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders', { params: { platform: 'LAZADA' } }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`), // Legacy endpoint
  
  // Seller endpoints (for lazada-clone sellers)
  updateStatus: (id: string, status: string) => api.patch(`/orders/seller/${id}/status`, { status }),
  getSellerOrders: (shopId: string) => api.get(`/orders/seller/${shopId}`),
};

export const sellerAPI = {
  getProducts: () => api.get('/seller/products'),
  createProduct: (data: any) => api.post('/seller/products', data),
  getOrders: (shopId: string) => orderAPI.getSellerOrders(shopId),
  getDashboard: (shopId: string) => api.get(`/seller/${shopId}/dashboard`),
  getIncome: (shopId: string, params?: any) => api.get(`/seller/${shopId}/income`, { params }),
};

export default api;
