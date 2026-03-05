import { useEffect, useRef } from 'react';
import { Copy, ClipboardCopy, ClipboardPaste, Trash2, Plus, Box, BookOpen } from 'lucide-react';

export interface ContextMenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 70,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '4px 0',
        minWidth: 180,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {actions.map((action, i) => (
        <div key={i}>
          {action.separator && (
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: action.danger ? 'var(--error)' : 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = action.danger
                ? 'rgba(239, 68, 68, 0.1)'
                : 'var(--bg-hover)';
              e.currentTarget.style.color = action.danger
                ? 'var(--error)'
                : 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = action.danger
                ? 'var(--error)'
                : 'var(--text-secondary)';
            }}
          >
            {action.icon}
            {action.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper to build node context menu actions
export function buildNodeActions(
  nodeId: string,
  nodeType: string,
  callbacks: {
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onCopy: () => void;
    onAddElement?: (id: string) => void;
  },
): ContextMenuAction[] {
  const actions: ContextMenuAction[] = [];

  if (nodeType === 'submodelNode' && callbacks.onAddElement) {
    actions.push({
      label: 'Element hinzufügen',
      icon: <Plus size={14} />,
      onClick: () => callbacks.onAddElement!(nodeId),
    });
  }

  actions.push({
    label: 'Kopieren',
    icon: <ClipboardCopy size={14} />,
    onClick: callbacks.onCopy,
  });

  actions.push({
    label: 'Duplizieren',
    icon: <Copy size={14} />,
    onClick: () => callbacks.onDuplicate(nodeId),
  });

  actions.push({
    label: 'Löschen',
    icon: <Trash2 size={14} />,
    onClick: () => callbacks.onDelete(nodeId),
    danger: true,
    separator: true,
  });

  return actions;
}

// Helper to build canvas context menu actions
export function buildCanvasActions(callbacks: {
  onAddShell: () => void;
  onAddCD: () => void;
  onPaste?: () => void;
}): ContextMenuAction[] {
  const actions: ContextMenuAction[] = [
    {
      label: 'Neue AAS',
      icon: <Box size={14} style={{ color: 'var(--node-aas)' }} />,
      onClick: callbacks.onAddShell,
    },
    {
      label: 'Neue CD',
      icon: <BookOpen size={14} style={{ color: 'var(--node-cd)' }} />,
      onClick: callbacks.onAddCD,
    },
  ];

  if (callbacks.onPaste) {
    actions.push({
      label: 'Einfügen',
      icon: <ClipboardPaste size={14} />,
      onClick: callbacks.onPaste,
      separator: true,
    });
  }

  return actions;
}
