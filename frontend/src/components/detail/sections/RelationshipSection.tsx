import { Section, FieldRow } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { Reference } from '../../../types/aas';

interface RelationshipSectionProps {
  modelType: string;
  first: Reference | undefined;
  second: Reference | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function RelationshipSection({ modelType, first, second, onChange }: RelationshipSectionProps) {
  const title = modelType === 'AnnotatedRelationshipElement' ? 'Annotated Relationship' : 'Relationship';

  return (
    <Section title={title}>
      <FieldRow label="first">
        <ReferenceEditor
          value={first}
          onChange={(ref) => onChange({ first: ref })}
        />
      </FieldRow>
      <FieldRow label="second">
        <ReferenceEditor
          value={second}
          onChange={(ref) => onChange({ second: ref })}
        />
      </FieldRow>
    </Section>
  );
}
