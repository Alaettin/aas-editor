import { Section, FieldRow, selectStyle } from './Section';
import type { ModellingKind } from '../../../types/aas';

interface SubmodelKindSectionProps {
  kind: ModellingKind | undefined;
  onChange: (kind: ModellingKind | undefined) => void;
}

export function SubmodelKindSection({ kind, onChange }: SubmodelKindSectionProps) {
  return (
    <Section title="Kind">
      <FieldRow label="kind">
        <select
          value={kind || ''}
          onChange={(e) => onChange((e.target.value || undefined) as ModellingKind | undefined)}
          style={selectStyle}
        >
          <option value="">(Standard)</option>
          <option value="Instance">Instance</option>
          <option value="Template">Template</option>
        </select>
      </FieldRow>
    </Section>
  );
}
