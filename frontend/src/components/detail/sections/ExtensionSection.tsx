import { Section } from './Section';
import { ExtensionEditor } from '../editors/ExtensionEditor';
import type { Extension } from '../../../types/aas';

interface ExtensionSectionProps {
  extensions: Extension[];
  onChange: (value: Extension[]) => void;
}

export function ExtensionSection({ extensions, onChange }: ExtensionSectionProps) {
  return (
    <Section title="Extensions" defaultOpen={extensions.length > 0}>
      <ExtensionEditor value={extensions} onChange={onChange} />
    </Section>
  );
}
