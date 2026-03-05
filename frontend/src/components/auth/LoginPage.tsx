import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuthStore } from '../../store/authStore';

const TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password, captchaToken || undefined);
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-base)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          AAS Canvas Editor
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          Melde dich an, um fortzufahren
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}
            >
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}
            >
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {TURNSTILE_KEY && (
            <Turnstile
              siteKey={TURNSTILE_KEY}
              onSuccess={setCaptchaToken}
              options={{ theme: 'dark', size: 'flexible' }}
            />
          )}

          {error && (
            <p style={{ fontSize: 13, color: 'var(--error)', textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (!!TURNSTILE_KEY && !captchaToken)}
            style={{
              padding: '10px 0',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background-color 0.2s, opacity 0.2s',
            }}
            onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = 'var(--accent)')}
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Noch kein Konto?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
