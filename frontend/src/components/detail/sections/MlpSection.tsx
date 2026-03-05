import { Section, FieldRow } from './Section';
import { LangStringEditor } from '../editors/LangStringEditor';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { LangString, Reference } from '../../../types/aas';

interface MlpSectionProps {
  value: LangString[];
  valueId: Reference | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function MlpSection({ value, valueId, onChange }: MlpSectionProps) {
  return (
    <Section title="Multi-Language Property">
      <FieldRow label="value">
        <LangStringEditor
          value={value}
          onChange={(v) => onChange({ value: v })}
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
