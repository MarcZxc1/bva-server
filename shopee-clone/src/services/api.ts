// API Service Layer for Shopee-Clone
// Use relative URLs in development (goes through Vite proxy) or absolute URL in production
const getBaseURL = () => {
  // In development, use relative URLs to leverage Vite proxy
  if (import.meta.env.DEV) {
    return ''; // Empty string means relative URLs
  }
  // In production, use the full API URL
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = getBaseURL();
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token') || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = this.baseURL ? `${this.baseURL}${normalizedEndpoint}` : normalizedEndpoint;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      // Handle wrapped responses { success: boolean, data: T }
      if (data.success !== undefined) {
        if (!data.success) {
          throw new Error(data.error || data.message || 'Request failed');
        }
        return data.data as T;
      }

      return data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth endpoints
  async register(data: {
    username?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'BUYER' | 'SELLER';
    name?: string;
  }) {
    // Server expects email, password, name, role (not username)
    const payload: any = {
      email: data.email,
      password: data.password,
      role: data.role || 'BUYER',
    };
    
    if (data.name) {
      payload.name = data.name;
    } else if (data.username) {
      payload.name = data.username;
    }
    
    return this.request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(email: string, password: string) {
    // Server expects email and password (not identifier)
    return this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    const userData = await this.request<any>('/api/auth/me');
    // Server returns shops in the response
    return {
      ...userData,
      shops: userData.shops || [],
    };
  }

  async logout() {
    this.setToken(null);
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  // Product endpoints
  async getProducts(shopId?: string) {
    if (shopId) {
      return this.request<any[]>(`/api/products/shop/${shopId}`);
    }
    // Get all products (for buyer landing page)
    return this.request<any[]>('/api/products');
  }

  async getProductById(productId: string) {
    return this.request<any>(`/api/products/${productId}`);
  }

  async createProduct(data: {
    shopId: string;
    name: string;
    description?: string;
    price: number;
    cost?: number;
    stock?: number;
    sku?: string;
    category?: string;
  }) {
    return this.request<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(productId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
    sku: string;
    category: string;
  }>) {
    return this.request<any>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(productId: string) {
    return this.request<void>(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints (for buyers)
  async createOrder(data: {
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    shippingAddress?: string;
    paymentMethod?: string;
  }) {
    return this.request<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyOrders() {
    return this.request<any[]>('/api/orders/my');
  }

  async getOrderById(orderId: string) {
    return this.request<any>(`/api/orders/${orderId}`);
  }

  // Seller order endpoints
  async getSellerOrders(shopId: string, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    return this.request<any[]>(`/api/orders/seller/${shopId}${queryString ? `?${queryString}` : ''}`);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request<any>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Income/Revenue endpoints
  async getSellerIncome(shopId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'released';
  }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    return this.request<any>(`/api/seller/${shopId}/income${queryString ? `?${queryString}` : ''}`);
  }

  // Dashboard endpoints
  async getSellerDashboard(shopId: string) {
    return this.request<any>(`/api/seller/${shopId}/dashboard`);
  }

  // User profile endpoints
  async updateProfile(data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
  }) {
    return this.request<any>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request<void>('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

