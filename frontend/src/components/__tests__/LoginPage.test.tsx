// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../auth/LoginPage';
import { useAuthStore } from '../../store/authStore';

// Mock Turnstile
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: () => null,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, session: null, loading: false, error: null });
});

describe('LoginPage', () => {
  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('AAS Canvas Editor')).toBeDefined();
    expect(screen.getByText('Anmelden')).toBeDefined();
  });

  it('renders email and password labels', () => {
    renderLogin();
    expect(screen.getByText('E-Mail')).toBeDefined();
    expect(screen.getByText('Passwort')).toBeDefined();
  });

  it('renders register link', () => {
    renderLogin();
    expect(screen.getByText('Registrieren')).toBeDefined();
  });

  it('displays error from store', () => {
    useAuthStore.setState({ error: 'Invalid credentials' });
    renderLogin();
    expect(screen.getByText('Invalid credentials')).toBeDefined();
  });

  it('calls signIn on form submit', async () => {
    const signIn = vi.fn().mockResolvedValue({ error: null });
    useAuthStore.setState({ signIn, error: null });
    renderLogin();

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(screen.getByText('Anmelden'));

    expect(signIn).toHaveBeenCalledWith('test@test.com', 'password', undefined);
  });
});
