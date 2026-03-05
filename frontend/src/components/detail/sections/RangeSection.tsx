import { Section, FieldRow, inputStyle, selectStyle } from './Section';
import type { DataTypeDefXsd } from '../../../types/aas';
import { ALL_XSD_TYPES } from '../../../utils/constants';

interface RangeSectionProps {
  valueType: DataTypeDefXsd;
  min: string;
  max: string;
  onChange: (changes: Record<string, unknown>) => void;
}

export function RangeSection({ valueType, min, max, onChange }: RangeSectionProps) {
  return (
    <Section title="Range">
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
      <FieldRow label="min">
        <input
          value={min}
          onChange={(e) => onChange({ min: e.target.value })}
          style={inputStyle}
          placeholder="(leer)"
        />
      </FieldRow>
      <FieldRow label="max">
        <input
          value={max}
          onChange={(e) => onChange({ max: e.target.value })}
          style={inputStyle}
          placeholder="(leer)"
        />
      </FieldRow>
    </Section>
  );
}
