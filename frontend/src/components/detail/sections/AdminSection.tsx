import { Section, FieldRow, inputStyle } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { AdministrativeInformation, Reference } from '../../../types/aas';

interface AdminSectionProps {
  administration: AdministrativeInformation | undefined;
  onChange: (value: AdministrativeInformation | undefined) => void;
}

export function AdminSection({ administration, onChange }: AdminSectionProps) {
  const admin = administration || { version: '', revision: '' };

  const update = (changes: Partial<AdministrativeInformation>) => {
    const updated = { ...admin, ...changes };
    if (!updated.version && !updated.revision && !updated.templateId && !updated.creator) {
      onChange(undefined);
    } else {
      onChange(updated);
    }
  };

  return (
    <Section title="Administration" defaultOpen={!!administration}>
      <FieldRow label="version">
        <input
          value={admin.version || ''}
          onChange={(e) => update({ version: e.target.value || undefined })}
          style={inputStyle}
          placeholder="1.0"
        />
      </FieldRow>
      <FieldRow label="revision">
        <input
          value={admin.revision || ''}
          onChange={(e) => update({ revision: e.target.value || undefined })}
          style={inputStyle}
          placeholder="0"
        />
      </FieldRow>
      <FieldRow label="templateId">
        <input
          value={admin.templateId || ''}
          onChange={(e) => update({ templateId: e.target.value || undefined })}
          style={inputStyle}
          placeholder="urn:..."
        />
      </FieldRow>
      <FieldRow label="creator">
        <ReferenceEditor
          value={admin.creator}
          onChange={(ref: Reference | undefined) => update({ creator: ref })}
        />
      </FieldRow>
    </Section>
  );
}
