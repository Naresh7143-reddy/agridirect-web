import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://agridirect-backend-80yz.onrender.com';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? Cookies.get('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('access_token');
      // window.location.href = '/login';
    }
    return Promise.reject(err);
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
  placeOrder: (data: any) => client.post('/api/buyer/orders', data).then((r) => r.data),
};

export const aiApi = {
  chat: (message: string, language = 'English') =>
    client.post('/api/farmer/ai/chat', { message, language }).then((r) => r.data),
};
