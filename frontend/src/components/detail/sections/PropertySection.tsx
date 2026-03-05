import { Section, FieldRow, inputStyle, selectStyle } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { DataTypeDefXsd, Reference } from '../../../types/aas';
import { ALL_XSD_TYPES } from '../../../utils/constants';

interface PropertySectionProps {
  valueType: DataTypeDefXsd;
  value: string;
  valueId: Reference | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function PropertySection({ valueType, value, valueId, onChange }: PropertySectionProps) {
  return (
    <Section title="Property">
      <FieldRow label="valueType">
        <select
          value={valueType}
          onChange={(e) => onChange({ valueType: e.target.value })}
          style={selectStyle}
        >
          {ALL_XSD_TYPES.map((vt) => (
            <option key={vt} value={vt}>{vt}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="value">
        <input
          value={value}
          onChange={(e) => onChange({ value: e.target.value })}
          style={inputStyle}
          placeholder="(leer)"
        />
      </FieldRow>
      <FieldRow label="valueId">
        <ReferenceEditor
          value={valueId}
          onChange={(ref) => onChange({ valueId: ref })}
        />
      </FieldRow>
    </Section>
  );
}
