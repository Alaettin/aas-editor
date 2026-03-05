import { Section, FieldRow } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { Reference } from '../../../types/aas';

interface ReferenceSectionProps {
  value: Reference | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function ReferenceSection({ value, onChange }: ReferenceSectionProps) {
  return (
    <Section title="Reference Element">
      <FieldRow label="value">
        <ReferenceEditor
          value={value}
          onChange={(ref) => onChange({ value: ref })}
        />
      </FieldRow>
    </Section>
  );
}
