import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FolderOpen, Globe, FileText, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { label: 'Projekte', path: '/projects', icon: FolderOpen },
  { label: 'API', path: '/api-config', icon: Globe },
  { label: 'API Docs', path: '/api-docs', icon: FileText },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredSignOut, setHoveredSignOut] = useState(false);

  const initial = (user?.email ?? 'U')[0].toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <nav
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'var(--accent)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-glow)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L12.5 4.5V9.5L7 13L1.5 9.5V4.5L7 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            AAS Canvas Editor
          </span>
        </div>

        {/* Center: Nav Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            backgroundColor: 'var(--bg-base)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHovered = hoveredNav === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredNav(item.path)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive
                    ? 'var(--bg-elevated)'
                    : isHovered
                      ? 'var(--bg-hover)'
                      : 'transparent',
                  color: isActive
                    ? 'var(--text-primary)'
                    : isHovered
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {initial}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={signOut}
            onMouseEnter={() => setHoveredSignOut(true)}
            onMouseLeave={() => setHoveredSignOut(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${hoveredSignOut ? 'var(--border-hover)' : 'var(--border)'}`,
              borderRadius: 8,
              color: hoveredSignOut ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={13} />
            Abmelden
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '40px 48px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </div>

    </div>
  );
}
