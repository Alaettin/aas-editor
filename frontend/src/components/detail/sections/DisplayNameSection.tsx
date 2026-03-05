import { Section } from './Section';
import { LangStringEditor } from '../editors/LangStringEditor';
import type { LangString } from '../../../types/aas';

interface DisplayNameSectionProps {
  displayName: LangString[];
  onChange: (value: LangString[]) => void;
}

export function DisplayNameSection({ displayName, onChange }: DisplayNameSectionProps) {
  return (
    <Section title="Anzeigename" defaultOpen={displayName.length > 0}>
      <LangStringEditor value={displayName} onChange={onChange} />
    </Section>
  );
}
