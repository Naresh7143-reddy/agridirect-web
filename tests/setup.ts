import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => '/',
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return Object.assign(document.createElement('img'), { src: props.src, alt: props.alt });
  },
}));

// Mock framer-motion — return plain React elements so tests don't deal with animations
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const makeForwardRef = (tag: string) =>
    React.forwardRef(({ children, ...rest }: any, ref: any) =>
      React.createElement(tag, { ...rest, ref }, children)
    );
  const handler = { get: (_: any, tag: string) => makeForwardRef(tag) };
  return {
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (v: any) => ({ get: () => v, set: vi.fn() }),
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

// Mock Firebase — RecaptchaVerifier must be constructable (regular function, not arrow)
vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
  RecaptchaVerifier: vi.fn(function (this: any) { this.clear = vi.fn(); this.render = vi.fn(); }),
  signInWithPhoneNumber: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
  authApi: { loginWithIdToken: vi.fn(), register: vi.fn() },
  productsApi: { list: vi.fn(), get: vi.fn(), search: vi.fn() },
  categoriesApi: { list: vi.fn() },
  buyerApi: { getOrders: vi.fn(), placeOrder: vi.fn() },
  saveAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
}));

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Suppress console errors from expected error states in tests
const consoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  consoleError(...args);
};
