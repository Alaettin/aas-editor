// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectListPage } from '../projects/ProjectListPage';
import { useProjectStore } from '../../store/projectStore';

function renderPage() {
  return render(
    <MemoryRouter>
      <ProjectListPage />
    </MemoryRouter>,
  );
}

const mockProjects = [
  { id: '1', name: 'Projekt A', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Projekt B', created_at: new Date().toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
];

beforeEach(() => {
  useProjectStore.setState({
    projects: [],
    currentProjectId: null,
    saving: false,
    loading: false,
    isDirty: false,
    fetchProjects: vi.fn(),
    createProject: vi.fn().mockResolvedValue('new-id'),
    deleteProject: vi.fn().mockResolvedValue(true),
  });
});

describe('ProjectListPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Projekte')).toBeDefined();
  });

  it('shows empty state when no projects', () => {
    renderPage();
    expect(screen.getByText('Noch keine Projekte')).toBeDefined();
  });

  it('renders project list', () => {
    useProjectStore.setState({ projects: mockProjects });
    renderPage();
    expect(screen.getByText('Projekt A')).toBeDefined();
    expect(screen.getByText('Projekt B')).toBeDefined();
  });

  it('shows create button', () => {
    renderPage();
    expect(screen.getAllByText('Neues Projekt').length).toBeGreaterThan(0);
  });

  it('shows relative time for recent project', () => {
    useProjectStore.setState({ projects: mockProjects });
    renderPage();
    expect(screen.getByText('gerade eben')).toBeDefined();
  });

  it('shows relative time for older project', () => {
    useProjectStore.setState({ projects: mockProjects });
    renderPage();
    expect(screen.getByText('vor 1 Std.')).toBeDefined();
  });

  it('calls fetchProjects on mount', () => {
    const fetchProjects = vi.fn();
    useProjectStore.setState({ fetchProjects });
    renderPage();
    expect(fetchProjects).toHaveBeenCalled();
  });
});
