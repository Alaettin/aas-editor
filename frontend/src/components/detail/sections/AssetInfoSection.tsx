import { Section, FieldRow, inputStyle, selectStyle } from './Section';
import { SpecificAssetIdEditor } from '../editors/SpecificAssetIdEditor';
import type { AssetInformation, AssetKind, SpecificAssetId } from '../../../types/aas';

interface AssetInfoSectionProps {
  assetInformation: AssetInformation;
  onChange: (value: AssetInformation) => void;
}

export function AssetInfoSection({ assetInformation, onChange }: AssetInfoSectionProps) {
  const update = (changes: Partial<AssetInformation>) => {
    onChange({ ...assetInformation, ...changes });
  };

  return (
    <Section title="Asset Information">
      <FieldRow label="assetKind">
        <select
          value={assetInformation.assetKind}
          onChange={(e) => update({ assetKind: e.target.value as AssetKind })}
          style={selectStyle}
        >
          <option value="Instance">Instance</option>
          <option value="Type">Type</option>
          <option value="NotApplicable">NotApplicable</option>
        </select>
      </FieldRow>
      <FieldRow label="globalAssetId">
        <input
          value={assetInformation.globalAssetId || ''}
          onChange={(e) => update({ globalAssetId: e.target.value || undefined })}
          style={inputStyle}
          placeholder="urn:..."
        />
      </FieldRow>
      <FieldRow label="assetType">
        <input
          value={assetInformation.assetType || ''}
          onChange={(e) => update({ assetType: e.target.value || undefined })}
          style={inputStyle}
          placeholder="Asset Type"
        />
      </FieldRow>
      <FieldRow label="specificAssetIds">
        <SpecificAssetIdEditor
          value={assetInformation.specificAssetIds ?? []}
          onChange={(v) => update({ specificAssetIds: v.length > 0 ? v : undefined })}
        />
      </FieldRow>
      <FieldRow label="defaultThumbnail path">
        <input
          value={assetInformation.defaultThumbnail?.path || ''}
          onChange={(e) => {
            const path = e.target.value;
            if (!path) {
              update({ defaultThumbnail: undefined });
            } else {
              update({
                defaultThumbnail: {
                  path,
                  contentType: assetInformation.defaultThumbnail?.contentType,
                },
              });
            }
          }}
          style={inputStyle}
          placeholder="/thumbnail.png"
        />
      </FieldRow>
    </Section>
  );
}
