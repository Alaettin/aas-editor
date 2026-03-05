import { Section, FieldRow, inputStyle, selectStyle } from './Section';
import { SpecificAssetIdEditor } from '../editors/SpecificAssetIdEditor';
import type { EntityType, SpecificAssetId } from '../../../types/aas';

interface EntitySectionProps {
  entityType: EntityType;
  globalAssetId: string | undefined;
  specificAssetIds: SpecificAssetId[];
  onChange: (changes: Record<string, unknown>) => void;
}

export function EntitySection({ entityType, globalAssetId, specificAssetIds, onChange }: EntitySectionProps) {
  return (
    <Section title="Entity">
      <FieldRow label="entityType">
        <select
          value={entityType}
          onChange={(e) => onChange({ entityType: e.target.value })}
          style={selectStyle}
        >
          <option value="SelfManagedEntity">SelfManagedEntity</option>
          <option value="CoManagedEntity">CoManagedEntity</option>
        </select>
      </FieldRow>
      <FieldRow label="globalAssetId">
        <input
          value={globalAssetId || ''}
          onChange={(e) => onChange({ globalAssetId: e.target.value || undefined })}
          style={inputStyle}
          placeholder="urn:..."
        />
      </FieldRow>
      <FieldRow label="specificAssetIds">
        <SpecificAssetIdEditor
          value={specificAssetIds}
          onChange={(v) => onChange({ specificAssetIds: v.length > 0 ? v : undefined })}
        />
      </FieldRow>
    </Section>
  );
}
