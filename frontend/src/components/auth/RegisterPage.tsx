import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuthStore } from '../../store/authStore';

const TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const signUp = useAuthStore((s) => s.signUp);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwörter stimmen nicht überein');
      return;
    }
    if (password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, captchaToken || undefined);
    setLoading(false);
    if (!result.error) {
      setSuccess(true);
    }
  };

  const displayError = localError || error;

  if (success) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>&#9993;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Bestätigungs-E-Mail gesendet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            Prüfe dein Postfach für <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> und
            klicke auf den Bestätigungslink.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

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
          Konto erstellen
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          Registriere dich für den AAS Canvas Editor
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(null); }}
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
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(null); }}
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

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null); }}
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

          {displayError && (
            <p style={{ fontSize: 13, color: 'var(--error)', textAlign: 'center' }}>{displayError}</p>
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
            {loading ? 'Wird registriert...' : 'Registrieren'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Bereits ein Konto?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
