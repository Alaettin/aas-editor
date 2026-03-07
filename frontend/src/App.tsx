import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { GuestGuard } from './components/auth/GuestGuard';
import { AppShell } from './components/layout/AppShell';
import { ProjectListPage } from './components/projects/ProjectListPage';
import { EditorPage } from './components/editor/EditorPage';
import { ApiConfigPage } from './components/api/ApiConfigPage';
import { ApiDocsPage } from './components/api/ApiDocsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ToastContainer } from './components/ui/Toast';

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
        <Route path="/projects" element={<AuthGuard><AppShell><ProjectListPage /></AppShell></AuthGuard>} />
        <Route path="/editor/:projectId" element={<AuthGuard><EditorPage /></AuthGuard>} />
        <Route path="/api-config" element={<AuthGuard><AppShell><ApiConfigPage /></AppShell></AuthGuard>} />
        <Route path="/api-docs" element={<AuthGuard><AppShell><ApiDocsPage /></AppShell></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><AppShell><SettingsPage /></AppShell></AuthGuard>} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
