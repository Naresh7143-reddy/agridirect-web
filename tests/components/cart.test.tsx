import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartPage from '@/app/buyer/cart/page';
import { useCart } from '@/lib/store';

// Helper: seed the cart store with items
function seedCart(items: any[]) {
  useCart.setState({ items });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset cart to empty before each test
  useCart.setState({ items: [] });
});

const MOCK_ITEM = {
  productId: 'prod-1',
  name: 'Fresh Tomatoes',
  price: 50,
  unit: 'kg',
  image: '',
  quantity: 2,
  farmerName: 'Ramesh',
};

describe('CartPage — Empty state', () => {
  it('shows empty cart message when cart is empty', () => {
    render(<CartPage />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('shows "Browse products" link in empty state', () => {
    render(<CartPage />);
    expect(screen.getByText(/browse products/i)).toBeInTheDocument();
  });

  it('does not render cart-item in empty state', () => {
    render(<CartPage />);
    expect(screen.queryByTestId('cart-item')).not.toBeInTheDocument();
  });
});

describe('CartPage — With items', () => {
  beforeEach(() => seedCart([MOCK_ITEM]));

  it('renders cart item with correct name', () => {
    render(<CartPage />);
    expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument();
  });

  it('renders cart-item testid', () => {
    render(<CartPage />);
    expect(screen.getByTestId('cart-item')).toBeInTheDocument();
  });

  it('shows correct quantity', () => {
    render(<CartPage />);
    expect(screen.getByTestId('qty-value')).toHaveTextContent('2');
  });

  it('shows checkout button', () => {
    render(<CartPage />);
    expect(screen.getByTestId('checkout-btn')).toBeInTheDocument();
  });

  it('shows order summary with correct total', () => {
    render(<CartPage />);
    // 2 × ₹50 = ₹100 subtotal + ₹40 delivery + ₹10 platform = ₹150
    expect(screen.getByText(/₹150/)).toBeInTheDocument();
  });

  it('shows free delivery message when subtotal ≥ ₹500', () => {
    seedCart([{ ...MOCK_ITEM, price: 500, quantity: 1 }]);
    render(<CartPage />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });
});

describe('CartPage — Quantity controls', () => {
  beforeEach(() => seedCart([MOCK_ITEM]));

  it('increments quantity when + is clicked', () => {
    render(<CartPage />);
    fireEvent.click(screen.getByTestId('qty-increase'));
    expect(screen.getByTestId('qty-value')).toHaveTextContent('3');
  });

  it('decrements quantity when − is clicked', () => {
    render(<CartPage />);
    fireEvent.click(screen.getByTestId('qty-decrease'));
    expect(screen.getByTestId('qty-value')).toHaveTextContent('1');
  });

  it('removes item when quantity goes to 0', () => {
    seedCart([{ ...MOCK_ITEM, quantity: 1 }]);
    render(<CartPage />);
    fireEvent.click(screen.getByTestId('qty-decrease'));
    expect(screen.queryByTestId('cart-item')).not.toBeInTheDocument();
  });
});

describe('CartPage — Remove & clear', () => {
  beforeEach(() => seedCart([MOCK_ITEM]));

  it('removes item when trash icon clicked', () => {
    render(<CartPage />);
    fireEvent.click(screen.getByTestId('remove-item'));
    expect(screen.queryByTestId('cart-item')).not.toBeInTheDocument();
  });

  it('clears all items when clear-all is clicked', () => {
    seedCart([MOCK_ITEM, { ...MOCK_ITEM, productId: 'prod-2', name: 'Onions' }]);
    render(<CartPage />);
    fireEvent.click(screen.getByTestId('cart-clear-btn'));
    expect(screen.queryByTestId('cart-item')).not.toBeInTheDocument();
  });
});

describe('CartPage — Multiple items', () => {
  it('renders all items when multiple products in cart', () => {
    seedCart([
      MOCK_ITEM,
      { ...MOCK_ITEM, productId: 'prod-2', name: 'Onions', price: 30, quantity: 1 },
    ]);
    render(<CartPage />);
    expect(screen.getAllByTestId('cart-item')).toHaveLength(2);
  });
});
