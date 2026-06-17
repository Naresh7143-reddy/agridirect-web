import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RegisterPage from '@/app/register/page';
import { authApi, saveAuthCookies } from '@/lib/api';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem('idToken', 'mock-firebase-id-token');
  sessionStorage.setItem('phone', '9876543210');
});

afterEach(() => sessionStorage.clear());

function setName(value: string) {
  fireEvent.change(screen.getByTestId('name-input'), { target: { value } });
}

async function goToFormStep(role: 'BUYER' | 'FARMER' | 'DELIVERY' = 'BUYER') {
  render(<RegisterPage />);
  await waitFor(() => expect(screen.getByTestId(`role-${role}`)).toBeInTheDocument());
  fireEvent.click(screen.getByTestId(`role-${role}`));
  await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument());
}

describe('RegisterPage — Role selection step', () => {
  it('renders all 3 role cards', async () => {
    render(<RegisterPage />);
    await waitFor(() => {
      expect(screen.getByTestId('role-BUYER')).toBeInTheDocument();
      expect(screen.getByTestId('role-FARMER')).toBeInTheDocument();
      expect(screen.getByTestId('role-DELIVERY')).toBeInTheDocument();
    });
  });

  it('shows BUYER role description', async () => {
    render(<RegisterPage />);
    await waitFor(() => expect(screen.getByText(/buy fresh produce/i)).toBeInTheDocument());
  });

  it('advances to form step when role is clicked', async () => {
    await goToFormStep('BUYER');
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
  });

  it('advances to FARMER form and shows farm fields', async () => {
    await goToFormStep('FARMER');
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByText(/farm name/i)).toBeInTheDocument();
  });
});

describe('RegisterPage — Form step', () => {
  it('submit button is disabled when name is empty', async () => {
    await goToFormStep();
    expect(screen.getByTestId('register-submit-btn')).toBeDisabled();
  });

  it('submit button enables after name is typed', async () => {
    await goToFormStep();
    setName('Ramesh Kumar');
    expect(screen.getByTestId('register-submit-btn')).not.toBeDisabled();
  });

  it('calls authApi.register with correct payload on submit', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      data: { tokens: { accessToken: 'tok', refreshToken: 'ref' }, user: { role: 'BUYER' } },
    } as any);

    await goToFormStep('BUYER');
    setName('Test User');

    await act(async () => {
      fireEvent.click(screen.getByTestId('register-submit-btn'));
    });

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          role: 'BUYER',
          idToken: 'mock-firebase-id-token',
        }),
      ),
    );
  });

  it('saves auth cookies on successful register', async () => {
    vi.mocked(authApi.register).mockResolvedValueOnce({
      data: { tokens: { accessToken: 'tok', refreshToken: 'ref' }, user: { role: 'BUYER' } },
    } as any);

    await goToFormStep('BUYER');
    setName('Test User');

    await act(async () => {
      fireEvent.click(screen.getByTestId('register-submit-btn'));
    });

    await waitFor(() => expect(saveAuthCookies).toHaveBeenCalled());
  });

  it('shows error toast when registration fails', async () => {
    vi.mocked(authApi.register).mockRejectedValueOnce({
      response: { data: { message: 'Registration failed' } },
    });

    await goToFormStep('BUYER');
    setName('Test User');

    await act(async () => {
      fireEvent.click(screen.getByTestId('register-submit-btn'));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Registration failed'));
  });

  it('redirects to /login when sessionStorage has no idToken', async () => {
    sessionStorage.clear();
    // toast.error should be called with session expired message
    render(<RegisterPage />);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/session expired/i)),
    );
  });
});
