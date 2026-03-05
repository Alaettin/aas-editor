import { useState, useRef, useEffect, useCallback } from 'react';

const ID_SHORT_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  validate?: (value: string) => boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  placeholder?: string;
}

export function InlineEdit({
  value,
  onSave,
  validate = (v) => ID_SHORT_REGEX.test(v),
  style,
  inputStyle,
  placeholder = 'idShort',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setInvalid(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, value]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && validate(trimmed)) {
      onSave(trimmed);
      setEditing(false);
    } else {
      setInvalid(true);
    }
  }, [draft, validate, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
    setInvalid(false);
  }, [value]);

  if (!editing) {
    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        style={{
          cursor: 'text',
          borderRadius: 4,
          padding: '1px 4px',
          margin: '-1px -4px',
          transition: 'background-color 0.15s',
          ...style,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
        title="Doppelklick zum Bearbeiten"
      >
        {value || placeholder}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        setInvalid(false);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-base)',
        border: `1px solid ${invalid ? 'var(--error)' : 'var(--accent)'}`,
        borderRadius: 4,
        padding: '1px 4px',
        margin: '-2px -5px',
        color: 'var(--text-primary)',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        fontFamily: 'inherit',
        outline: 'none',
        ...inputStyle,
      }}
      placeholder={placeholder}
    />
  );
}
