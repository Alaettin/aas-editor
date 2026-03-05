import { Section, FieldRow, inputStyle, selectStyle } from './Section';
import { ReferenceEditor } from '../editors/ReferenceEditor';
import type { Reference } from '../../../types/aas';

interface EventSectionProps {
  observed: Reference | undefined;
  direction: string;
  state: string;
  messageTopic: string | undefined;
  messageBroker: Reference | undefined;
  lastUpdate: string | undefined;
  minInterval: string | undefined;
  maxInterval: string | undefined;
  onChange: (changes: Record<string, unknown>) => void;
}

export function EventSection({
  observed, direction, state, messageTopic, messageBroker,
  lastUpdate, minInterval, maxInterval, onChange,
}: EventSectionProps) {
  return (
    <Section title="Basic Event Element">
      <FieldRow label="observed">
        <ReferenceEditor
          value={observed}
          onChange={(ref) => onChange({ observed: ref })}
        />
      </FieldRow>
      <FieldRow label="direction">
        <select
          value={direction}
          onChange={(e) => onChange({ direction: e.target.value })}
          style={selectStyle}
        >
          <option value="input">Input</option>
          <option value="output">Output</option>
        </select>
      </FieldRow>
      <FieldRow label="state">
        <select
          value={state}
          onChange={(e) => onChange({ state: e.target.value })}
          style={selectStyle}
        >
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
      </FieldRow>
      <FieldRow label="messageTopic">
        <input
          value={messageTopic || ''}
          onChange={(e) => onChange({ messageTopic: e.target.value || undefined })}
          style={inputStyle}
          placeholder="Topic"
        />
      </FieldRow>
      <FieldRow label="messageBroker">
        <ReferenceEditor
          value={messageBroker}
          onChange={(ref) => onChange({ messageBroker: ref })}
        />
      </FieldRow>
      <FieldRow label="lastUpdate">
        <input
          value={lastUpdate || ''}
          onChange={(e) => onChange({ lastUpdate: e.target.value || undefined })}
          style={inputStyle}
          placeholder="xs:dateTime"
        />
      </FieldRow>
      <FieldRow label="minInterval">
        <input
          value={minInterval || ''}
          onChange={(e) => onChange({ minInterval: e.target.value || undefined })}
          style={inputStyle}
          placeholder="xs:duration"
        />
      </FieldRow>
      <FieldRow label="maxInterval">
        <input
          value={maxInterval || ''}
          onChange={(e) => onChange({ maxInterval: e.target.value || undefined })}
          style={inputStyle}
          placeholder="xs:duration"
        />
      </FieldRow>
    </Section>
  );
}
