import { Section } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { Reference } from '../../../types/aas';

interface DerivedFromSectionProps {
  derivedFrom: Reference | undefined;
  onChange: (value: Reference | undefined) => void;
}

export function DerivedFromSection({ derivedFrom, onChange }: DerivedFromSectionProps) {
  return (
    <Section title="Abgeleitet von" defaultOpen={!!derivedFrom}>
      <ReferenceEditor value={derivedFrom} onChange={onChange} />
    </Section>
  );
}
