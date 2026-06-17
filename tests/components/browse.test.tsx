import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { productsApi } from '@/lib/api';

// BrowsePage uses Suspense + useSearchParams — test BrowseInner behaviour
// by rendering the outer page and waiting for Suspense to resolve

const MOCK_PRODUCTS = [
  { id: '1', name: 'Tomatoes', price: 50, unit: 'kg', farmerName: 'Ravi', isAvailable: true },
  { id: '2', name: 'Onions', price: 30, unit: 'kg', farmerName: 'Suresh', isAvailable: true },
  { id: '3', name: 'Mangoes', price: 120, unit: 'kg', farmerName: 'Priya', isAvailable: true },
];

// Dynamic import to avoid SSR issues with useSearchParams
async function renderBrowse() {
  const { default: BrowsePage } = await import('@/app/buyer/browse/page');
  return render(<BrowsePage />);
}

describe('BrowsePage — Loading state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows skeleton cards while loading', async () => {
    vi.mocked(productsApi.list).mockReturnValue(new Promise(() => {})); // never resolves
    await renderBrowse();
    // Skeleton elements have animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('BrowsePage — Products loaded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsApi.list).mockResolvedValue({ data: MOCK_PRODUCTS } as any);
  });

  it('renders the search input', async () => {
    await renderBrowse();
    await waitFor(() => expect(screen.getByTestId('browse-search-input')).toBeInTheDocument());
  });

  it('shows correct product count', async () => {
    await renderBrowse();
    await waitFor(() => expect(screen.getByText(/3 items from verified farmers/i)).toBeInTheDocument());
  });

  it('renders all product names', async () => {
    await renderBrowse();
    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Onions')).toBeInTheDocument();
      expect(screen.getByText('Mangoes')).toBeInTheDocument();
    });
  });
});

describe('BrowsePage — Search filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsApi.list).mockResolvedValue({ data: MOCK_PRODUCTS } as any);
  });

  it('filters products by name as user types', async () => {
    await renderBrowse();
    const input = await screen.findByTestId('browse-search-input');
    await userEvent.type(input, 'tom');
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.queryByText('Onions')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no results', async () => {
    await renderBrowse();
    const input = await screen.findByTestId('browse-search-input');
    await userEvent.type(input, 'xyz-does-not-exist');
    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
  });

  it('shows all products when search is cleared', async () => {
    await renderBrowse();
    const input = await screen.findByTestId('browse-search-input');
    await userEvent.type(input, 'tom');
    await userEvent.clear(input);
    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Onions')).toBeInTheDocument();
    });
  });

  it('search is case-insensitive', async () => {
    await renderBrowse();
    const input = await screen.findByTestId('browse-search-input');
    await userEvent.type(input, 'MANGO');
    expect(screen.getByText('Mangoes')).toBeInTheDocument();
  });
});

describe('BrowsePage — Empty state', () => {
  it('shows empty state when API returns no products', async () => {
    vi.mocked(productsApi.list).mockResolvedValue({ data: [] } as any);
    await renderBrowse();
    await waitFor(() => expect(screen.getByText(/no products match/i)).toBeInTheDocument());
  });
});
