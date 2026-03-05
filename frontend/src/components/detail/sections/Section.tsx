import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '10px 16px',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
        {title}
      </button>
      {open && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Shared field row for label + input
export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

// Shared input style
export const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '6px 8px',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  transition: 'border-color 0.15s',
};

// Shared select style
export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};
