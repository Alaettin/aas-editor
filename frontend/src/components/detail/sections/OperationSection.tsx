import { Section } from './Section';

interface OperationSectionProps {
  inputCount: number;
  outputCount: number;
  inoutputCount: number;
}

export function OperationSection({ inputCount, outputCount, inoutputCount }: OperationSectionProps) {
  return (
    <Section title="Operation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <InfoRow label="inputVariables" count={inputCount} />
        <InfoRow label="outputVariables" count={outputCount} />
        <InfoRow label="inoutputVariables" count={inoutputCount} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
        Variablen werden über die Canvas verwaltet.
      </div>
    </Section>
  );
}

function InfoRow({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{count}</span>
    </div>
  );
}
