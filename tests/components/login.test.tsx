import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { signInWithPhoneNumber } from '@/lib/firebase';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).recaptchaVerifier = { clear: vi.fn() };
  (window as any).confirmationResult = undefined;
});

// Helper that always queries fresh from DOM (not stale closures)
const phoneInput = () => screen.getByTestId('phone-input') as HTMLInputElement;
const sendOtpBtn = () => screen.getByTestId('send-otp-btn') as HTMLButtonElement;
const otpInput = () => screen.getByTestId('otp-input') as HTMLInputElement;
const verifyBtn = () => screen.getByTestId('verify-otp-btn') as HTMLButtonElement;

async function typePhone(value: string) {
  await act(async () => {
    fireEvent.change(phoneInput(), { target: { value } });
  });
}

async function typeOtp(value: string) {
  await act(async () => {
    fireEvent.change(otpInput(), { target: { value } });
  });
}

describe('LoginPage — Phone step', () => {
  it('renders phone input and disabled send-OTP button initially', () => {
    render(<LoginPage />);
    expect(phoneInput()).toBeInTheDocument();
    expect(sendOtpBtn()).toBeDisabled();
  });

  it('enables send-OTP button only after 10 digits', async () => {
    render(<LoginPage />);
    await typePhone('98765');
    expect(sendOtpBtn()).toBeDisabled();

    await typePhone('9876543210');
    await waitFor(() => expect(sendOtpBtn()).not.toBeDisabled());
  });

  it('filters non-numeric characters from phone input', async () => {
    render(<LoginPage />);
    // onChange: e.target.value.replace(/\D/g,'').slice(0,10)
    // Firing change with 'abc123def' → handler extracts '123'
    await typePhone('abc123def');
    await waitFor(() => expect(phoneInput().value).toBe('123'));
  });

  it('clamps phone input to 10 digits max', async () => {
    render(<LoginPage />);
    await typePhone('12345678901234');
    await waitFor(() => expect(phoneInput().value.length).toBeLessThanOrEqual(10));
  });

  it('shows error toast on sendOTP failure', async () => {
    vi.mocked(signInWithPhoneNumber).mockRejectedValueOnce(new Error('network error'));
    render(<LoginPage />);
    await typePhone('9876543210');
    await waitFor(() => expect(sendOtpBtn()).not.toBeDisabled());
    await act(async () => { fireEvent.click(sendOtpBtn()); });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe('LoginPage — OTP step', () => {
  async function goToOtpStep() {
    const mockConfirm = vi.fn();
    vi.mocked(signInWithPhoneNumber).mockResolvedValueOnce({ confirm: mockConfirm } as any);
    render(<LoginPage />);
    await typePhone('9876543210');
    await waitFor(() => expect(sendOtpBtn()).not.toBeDisabled());
    await act(async () => { fireEvent.click(sendOtpBtn()); });
    await waitFor(() => expect(otpInput()).toBeInTheDocument(), { timeout: 3000 });
    return mockConfirm;
  }

  it('shows OTP input after successful OTP send', async () => {
    await goToOtpStep();
    expect(otpInput()).toBeInTheDocument();
  });

  it('verify button is disabled until 6 digits entered', async () => {
    await goToOtpStep();
    expect(verifyBtn()).toBeDisabled();

    await typeOtp('12345');
    expect(verifyBtn()).toBeDisabled();

    await typeOtp('123456');
    await waitFor(() => expect(verifyBtn()).not.toBeDisabled());
  });

  it('clamps OTP to 6 digits', async () => {
    await goToOtpStep();
    await typeOtp('1234567890');
    await waitFor(() => expect(otpInput().value.length).toBeLessThanOrEqual(6));
  });

  it('OTP input only keeps digit characters', async () => {
    await goToOtpStep();
    await typeOtp('abc456');
    await waitFor(() => expect(otpInput().value).toBe('456'));
  });
});

describe('LoginPage — UI states', () => {
  it('renders the AgriDirect heading', () => {
    render(<LoginPage />);
    expect(screen.getByText('AgriDirect')).toBeInTheDocument();
  });

  it('shows sign-in subtitle on phone step', () => {
    render(<LoginPage />);
    expect(screen.getByText(/sign in with your phone/i)).toBeInTheDocument();
  });

  it('renders test credentials hint', () => {
    render(<LoginPage />);
    expect(screen.getByText(/8919012622/)).toBeInTheDocument();
  });
});
