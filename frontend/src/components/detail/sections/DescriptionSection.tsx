import { Section } from './Section';
import { LangStringEditor } from '../editors/LangStringEditor';
import type { LangString } from '../../../types/aas';

interface DescriptionSectionProps {
  description: LangString[];
  onChange: (value: LangString[]) => void;
}

export function DescriptionSection({ description, onChange }: DescriptionSectionProps) {
  return (
    <Section title="Beschreibung" defaultOpen={description.length > 0}>
      <LangStringEditor value={description} onChange={onChange} />
    </Section>
  );
}
