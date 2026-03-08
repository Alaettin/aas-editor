// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../ui/ExportDialog';
import type { AssetAdministrationShell } from '../../types/aas';

const mockShells: AssetAdministrationShell[] = [
  {
    id: 'urn:aas:1',
    idShort: 'AAS_SensorX',
    modelType: 'AssetAdministrationShell',
    assetInformation: { assetKind: 'Type', globalAssetId: 'urn:asset:1' },
  } as AssetAdministrationShell,
  {
    id: 'urn:aas:2',
    idShort: 'AAS_PumpY',
    modelType: 'AssetAdministrationShell',
    assetInformation: { assetKind: 'Type', globalAssetId: 'urn:asset:2' },
  } as AssetAdministrationShell,
];

describe('ExportDialog', () => {
  it('renders with shell selection', () => {
    render(<ExportDialog shells={mockShells} onExport={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('AAS_SensorX')).toBeDefined();
    expect(screen.getByText('AAS_PumpY')).toBeDefined();
  });

  it('renders title', () => {
    render(<ExportDialog shells={mockShells} onExport={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('AAS exportieren')).toBeDefined();
  });

  it('renders format options', () => {
    render(<ExportDialog shells={mockShells} onExport={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('JSON')).toBeDefined();
    expect(screen.getByText('XML')).toBeDefined();
    expect(screen.getByText('AASX')).toBeDefined();
  });

  it('calls onExport with selected shell and format', () => {
    const onExport = vi.fn();
    render(<ExportDialog shells={mockShells} onExport={onExport} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('Exportieren'));
    expect(onExport).toHaveBeenCalledWith('urn:aas:1', 'json', 'AAS_SensorX.json');
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<ExportDialog shells={mockShells} onExport={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('auto-generates filename from selected shell', () => {
    render(<ExportDialog shells={mockShells} onExport={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByDisplayValue('AAS_SensorX.json');
    expect(input).toBeDefined();
  });

  it('selects second shell on click', () => {
    const onExport = vi.fn();
    render(<ExportDialog shells={mockShells} onExport={onExport} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('AAS_PumpY'));
    fireEvent.click(screen.getByText('Exportieren'));
    expect(onExport).toHaveBeenCalledWith('urn:aas:2', 'json', 'AAS_PumpY.json');
  });
});
