import { Section } from './Section';
import { QualifierEditor } from '../editors/QualifierEditor';
import type { Qualifier } from '../../../types/aas';

interface QualifierSectionProps {
  qualifiers: Qualifier[];
  onChange: (value: Qualifier[]) => void;
}

export function QualifierSection({ qualifiers, onChange }: QualifierSectionProps) {
  return (
    <Section title="Qualifier" defaultOpen={qualifiers.length > 0}>
      <QualifierEditor value={qualifiers} onChange={onChange} />
    </Section>
  );
}
