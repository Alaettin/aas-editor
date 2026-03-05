import { Section, FieldRow, selectStyle } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { DataTypeDefXsd, Reference } from '../../../types/aas';
import { ALL_XSD_TYPES, ALL_ELEMENT_TYPES } from '../../../utils/constants';

interface ListSectionProps {
  typeValueListElement: string;
  valueTypeListElement: DataTypeDefXsd | undefined;
  semanticIdListElement: Reference | undefined;
  orderRelevant: boolean | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function ListSection({ typeValueListElement, valueTypeListElement, semanticIdListElement, orderRelevant, onChange }: ListSectionProps) {
  return (
    <Section title="List">
      <FieldRow label="typeValueListElement">
        <select
          value={typeValueListElement}
          onChange={(e) => onChange({ typeValueListElement: e.target.value })}
          style={selectStyle}
        >
          {ALL_ELEMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="valueTypeListElement">
        <select
          value={valueTypeListElement || ''}
          onChange={(e) => onChange({ valueTypeListElement: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">(keine)</option>
          {ALL_XSD_TYPES.map((vt) => (
            <option key={vt} value={vt}>{vt}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="semanticIdListElement">
        <ReferenceEditor
          value={semanticIdListElement}
          onChange={(ref) => onChange({ semanticIdListElement: ref })}
        />
      </FieldRow>
      <FieldRow label="orderRelevant">
        <select
          value={orderRelevant === undefined ? '' : String(orderRelevant)}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ orderRelevant: v === '' ? undefined : v === 'true' });
          }}
          style={selectStyle}
        >
          <option value="">(Standard)</option>
          <option value="true">Ja</option>
          <option value="false">Nein</option>
        </select>
      </FieldRow>
    </Section>
  );
}
