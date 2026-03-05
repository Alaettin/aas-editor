import { Section, FieldRow, inputStyle } from './Section';

interface FileSectionProps {
  modelType: 'File' | 'Blob';
  contentType: string;
  value: string;
  onChange: (changes: Record<string, unknown>) => void;
}

export function FileSection({ modelType, contentType, value, onChange }: FileSectionProps) {
  return (
    <Section title={modelType}>
      <FieldRow label="contentType">
        <input
          value={contentType}
          onChange={(e) => onChange({ contentType: e.target.value })}
          style={inputStyle}
          placeholder="application/octet-stream"
        />
      </FieldRow>
      {modelType === 'File' && (
        <FieldRow label="value">
          <input
            value={value}
            onChange={(e) => onChange({ value: e.target.value })}
            style={inputStyle}
            placeholder="/path/to/file"
          />
        </FieldRow>
      )}
    </Section>
  );
}
