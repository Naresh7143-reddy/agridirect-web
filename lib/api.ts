import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://agridirect-backend-80yz.onrender.com';

// Cookie options — secure + sameSite so cookies persist correctly on Vercel (HTTPS)
export const COOKIE_OPTS: Cookies.CookieAttributes = {
  expires: 90,
  sameSite: 'Lax',
  secure: process.env.NODE_ENV === 'production',
};

export function saveAuthCookies(tokens: { accessToken: string; refreshToken?: string }, role: string) {
  Cookies.set('access_token', tokens.accessToken, COOKIE_OPTS);
  if (tokens.refreshToken) Cookies.set('refresh_token', tokens.refreshToken, COOKIE_OPTS);
  Cookies.set('user_role', role, COOKIE_OPTS);
}

export function clearAuthCookies() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  Cookies.remove('user_role');
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? Cookies.get('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

client.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;

    // Rate-limited: show message and bail out (do NOT attempt token refresh)
    if (err.response?.status === 429) {
      if (typeof window !== 'undefined') {
        // Dynamically import toast to avoid SSR issues
        import('sonner').then(({ toast }) =>
          toast.error('Too many requests. Please wait 1 minute and try again.')
        );
      }
      return Promise.reject(err);
    }

    if (err.response?.status !== 401 || original._retry || typeof window === 'undefined') {
      return Promise.reject(err);
    }

    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      clearAuthCookies();
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(client(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = res.data?.data ?? res.data;
      Cookies.set('access_token', accessToken, COOKIE_OPTS);
      if (newRefresh) Cookies.set('refresh_token', newRefresh, COOKIE_OPTS);
      client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      refreshQueue.forEach((cb) => cb(accessToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${accessToken}`;
      return client(original);
    } catch (refreshErr: any) {
      // Only force logout on definitive auth rejection (4xx), not network errors
      const status = refreshErr?.response?.status;
      if (status && status >= 400 && status < 500) {
        clearAuthCookies();
        window.location.href = '/login';
      }
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;

// ─── Resource modules ─────────────────────────────────────────────────────────

export const authApi = {
  loginWithIdToken: (idToken: string) =>
    client.post('/api/auth/login', { idToken }).then((r) => r.data),
  register: (payload: any) =>
    client.post('/api/auth/register', payload).then((r) => r.data),
};

export const productsApi = {
  list: () => client.get('/api/products').then((r) => r.data),
  get: (id: string) => client.get(`/api/products/${id}`).then((r) => r.data),
  search: (q: string) =>
    client.get(`/api/products/search`, { params: { q } }).then((r) => r.data),
};

export const categoriesApi = {
  list: () => client.get('/api/categories').then((r) => r.data),
};

export const buyerApi = {
  getAddresses: () => client.get('/api/buyer/addresses').then((r) => r.data),
  addAddress: (data: any) => client.post('/api/buyer/addresses', data).then((r) => r.data),
  updateAddress: (id: string, data: any) => client.put(`/api/buyer/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id: string) => client.delete(`/api/buyer/addresses/${id}`).then((r) => r.data),
  setDefaultAddress: (id: string) => client.patch(`/api/buyer/addresses/${id}/default`).then((r) => r.data),
  getOrders: () => client.get('/api/buyer/orders').then((r) => r.data),
  getOrder: (id: string) => client.get(`/api/buyer/orders/${id}`).then((r) => r.data),
  placeOrder: (data: any) => client.post('/api/buyer/orders', data).then((r) => r.data),
  cancelOrder: (id: string) => client.post(`/api/buyer/orders/${id}/cancel`).then((r) => r.data),
  rateOrder: (id: string, data: { rating: number; review?: string }) =>
    client.post(`/api/buyer/orders/${id}/rate`, data).then((r) => r.data),
};

export const wishlistApi = {
  list: () => client.get('/api/buyer/wishlist').then((r) => r.data),
  add: (productId: string) => client.post('/api/buyer/wishlist', { productId }).then((r) => r.data),
  remove: (productId: string) => client.delete(`/api/buyer/wishlist/${productId}`).then((r) => r.data),
  check: (productId: string) => client.get(`/api/buyer/wishlist/${productId}/check`).then((r) => r.data),
};

export const paymentApi = {
  createOrder: (data: any) => client.post('/api/payment/create-order', data).then((r) => r.data),
  verify: (data: any) => client.post('/api/payment/verify', data).then((r) => r.data),
  history: () => client.get('/api/payment/history').then((r) => r.data),
  requestRefund: (paymentId: string) => client.post(`/api/payment/${paymentId}/refund`).then((r) => r.data),
  getRefund: (refundId: string) => client.get(`/api/payment/refunds/${refundId}`).then((r) => r.data),
};

export const buyerProfileApi = {
  update: (data: any) => client.put('/api/buyer/profile', data).then((r) => r.data),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/api/buyer/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};

export const farmerApi = {
  updateProduct: (id: string, data: any) => client.put(`/api/farmer/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id: string) => client.delete(`/api/farmer/products/${id}`).then((r) => r.data),
  toggleAvailability: (id: string, available?: boolean) =>
    client.put(`/api/farmer/products/${id}/availability`, { available: available ?? true }).then((r) => r.data),
  updateProfile: (data: any) => client.put('/api/farmer/profile', data).then((r) => r.data),
  uploadProfilePhoto: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/api/farmer/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  getBankDetails: () => client.get('/api/farmer/bank-details').then((r) => r.data),
  updateBankDetails: (data: any) => client.put('/api/farmer/bank-details', data).then((r) => r.data),
  getOrderDetail: (id: string) => client.get(`/api/farmer/orders/${id}`).then((r) => r.data),
  getEarnings: () => client.get('/api/farmer/earnings').then((r) => r.data),
  getDashboard: () => client.get('/api/farmer/dashboard').then((r) => r.data),
};

export const deliveryApi = {
  getProfile: () => client.get('/api/delivery/profile').then((r) => r.data),
  updateProfile: (data: any) => client.put('/api/delivery/profile', data).then((r) => r.data),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/api/delivery/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  getEarnings: () => client.get('/api/delivery/earnings').then((r) => r.data),
  updateAvailability: (available: boolean) =>
    client.put('/api/delivery/availability', { available }).then((r) => r.data),
  updateLocation: (lat: number, lng: number) =>
    client.put('/api/delivery/location', { lat, lng }).then((r) => r.data),
  getOrders: () => client.get('/api/delivery/orders').then((r) => r.data),
  getAvailableOrders: () => client.get('/api/delivery/orders/available').then((r) => r.data),
  claimOrder: (id: string) => client.post(`/api/delivery/orders/${id}/claim`).then((r) => r.data),
  updateOrderStatus: (id: string, status: string) =>
    client.put(`/api/delivery/orders/${id}/status`, { status }).then((r) => r.data),
  getOrderById: (id: string) => client.get(`/api/delivery/orders/${id}`).then((r) => r.data),
  confirmOrder: (id: string) => client.post(`/api/delivery/orders/${id}/confirm`).then((r) => r.data),
};

export const notificationsApi = {
  list: () => client.get('/api/notifications').then((r) => r.data),
  unreadCount: () => client.get('/api/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => client.patch(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => client.post('/api/notifications/mark-all-read').then((r) => r.data),
};

export const adminApi = {
  getPendingFarmers: () => client.get('/api/admin/farmers/pending').then((r) => r.data),
  verifyFarmer: (id: string) => client.put(`/api/admin/farmers/${id}/verify`).then((r) => r.data),
  rejectFarmer: (id: string) => client.put(`/api/admin/farmers/${id}/reject`).then((r) => r.data),
  getPendingProducts: () => client.get('/api/admin/products/pending').then((r) => r.data),
  approveProduct: (id: string) => client.put(`/api/admin/products/${id}/approve`).then((r) => r.data),
  rejectProduct: (id: string) => client.put(`/api/admin/products/${id}/reject`).then((r) => r.data),
  getOrderDetail: (id: string) => client.get(`/api/admin/orders/${id}`).then((r) => r.data),
  assignDelivery: (orderId: string, partnerId: string) =>
    client.post(`/api/admin/orders/${orderId}/assign-delivery`, { deliveryPartnerId: partnerId }).then((r) => r.data),
  getReport: (type: string, params?: any) =>
    client.get(`/api/admin/reports/${type}`, { params }).then((r) => r.data),
  getAllUsers: () => client.get('/api/admin/users').then((r) => r.data),
  getUsersByRole: (role: string) => client.get(`/api/admin/users/role/${role}`).then((r) => r.data),
  blockUser: (id: string) => client.put(`/api/admin/users/${id}/block`).then((r) => r.data),
  unblockUser: (id: string) => client.put(`/api/admin/users/${id}/unblock`).then((r) => r.data),
  getAllOrders: () => client.get('/api/admin/orders').then((r) => r.data),
  updateOrderStatus: (id: string, status: string) =>
    client.put(`/api/admin/orders/${id}/status`, { status }).then((r) => r.data),
  getAnalytics: () => client.get('/api/admin/analytics').then((r) => r.data),
  sendNotification: (data: any) => client.post('/api/admin/notifications', data).then((r) => r.data),
};

export const aiApi = {
  chat: (
    message: string,
    language = 'English',
    history: { role: 'user' | 'assistant'; content: string }[] = [],
    imageBase64?: string,
  ) =>
    client.post('/api/farmer/ai/chat', { message, language, history, imageBase64 }).then((r) => r.data),
  detectDisease: (image: File, cropName: string) => {
    const fd = new FormData();
    fd.append('image', image);
    fd.append('cropName', cropName);
    return client.post('/api/farmer/ai/disease', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  getCropAdvice: (data: { season: string; location: string; soilType: string; waterAvailability: string }) =>
    client.post('/api/farmer/ai/advice', data).then((r) => r.data),
  getPriceForecast: (data: { cropName: string; location: string }) =>
    client.post('/api/farmer/ai/price-forecast', data).then((r) => r.data),
};
