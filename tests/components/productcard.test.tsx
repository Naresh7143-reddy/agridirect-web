import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/common/ProductCard';
import { useCart } from '@/lib/store';
import { toast } from 'sonner';

const MOCK_PRODUCT = {
  id: 'prod-1',
  name: 'Fresh Tomatoes',
  price: 50,
  unit: 'kg',
  farmerName: 'Ravi Kumar',
  imageUrls: [],
  isAvailable: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  useCart.setState({ items: [] });
});

describe('ProductCard — Display', () => {
  it('renders product name', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument();
  });

  it('renders farmer name', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.getByText(/Ravi Kumar/)).toBeInTheDocument();
  });

  it('renders price with currency', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.getByText(/₹50/)).toBeInTheDocument();
  });

  it('renders unit', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.getByText(/\/kg/)).toBeInTheDocument();
  });

  it('shows organic badge when product.isOrganic is true', () => {
    render(<ProductCard product={{ ...MOCK_PRODUCT, isOrganic: true }} />);
    expect(screen.getByText('Organic')).toBeInTheDocument();
  });

  it('does not show organic badge by default', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.queryByText('Organic')).not.toBeInTheDocument();
  });

  it('has a link to the product detail page', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/buyer/product/prod-1');
  });
});

describe('ProductCard — Add to cart', () => {
  it('renders add-to-cart button with correct testid', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    expect(screen.getByTestId('add-to-cart-btn')).toBeInTheDocument();
  });

  it('adds product to cart on button click', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-1');
    expect(items[0].quantity).toBe(1);
  });

  it('increments quantity when same product added twice', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it('shows success toast when product added', () => {
    render(<ProductCard product={MOCK_PRODUCT} />);
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Fresh Tomatoes'));
  });
});
