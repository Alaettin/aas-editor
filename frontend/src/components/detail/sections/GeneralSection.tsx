import { Section, FieldRow, inputStyle } from './Section';

interface GeneralSectionProps {
  idShort: string;
  id?: string;
  category?: string;
  onIdShortChange: (value: string) => void;
  onIdChange?: (value: string) => void;
  onCategoryChange?: (value: string | undefined) => void;
}

export function GeneralSection({ idShort, id, category, onIdShortChange, onIdChange, onCategoryChange }: GeneralSectionProps) {
  return (
    <Section title="Allgemein">
      <FieldRow label="idShort">
        <input
          value={idShort}
          onChange={(e) => onIdShortChange(e.target.value)}
          style={inputStyle}
          placeholder="idShort"
        />
      </FieldRow>
      {id !== undefined && onIdChange && (
        <FieldRow label="id">
          <input
            value={id}
            onChange={(e) => onIdChange(e.target.value)}
            style={inputStyle}
            placeholder="urn:..."
          />
        </FieldRow>
      )}
      {onCategoryChange && (
        <FieldRow label="category">
          <input
            value={category || ''}
            onChange={(e) => onCategoryChange(e.target.value || undefined)}
            style={inputStyle}
            placeholder="(optional)"
          />
        </FieldRow>
      )}
    </Section>
  );
}
