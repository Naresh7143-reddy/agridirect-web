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
  placeOrder: (data: any) => client.post('/api/buyer/orders', data).then((r) => r.data),
};

export const aiApi = {
  chat: (
    message: string,
    language = 'English',
    history: { role: 'user' | 'assistant'; content: string }[] = [],
    imageBase64?: string,
  ) =>
    client.post('/api/farmer/ai/chat', { message, language, history, imageBase64 }).then((r) => r.data),
};
