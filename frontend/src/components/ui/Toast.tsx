import { X } from 'lucide-react';
import { useToastStore, type ToastType } from '../../store/toastStore';

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'var(--success-subtle)',
    border: 'var(--success)',
    text: 'var(--success)',
  },
  error: {
    bg: 'var(--error-subtle)',
    border: 'var(--error)',
    text: 'var(--error)',
  },
  info: {
    bg: 'var(--accent-subtle)',
    border: 'var(--accent)',
    text: 'var(--accent)',
  },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const c = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              color: c.text,
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 420,
              minWidth: 280,
              animation: 'toast-in 0.2s ease-out',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
