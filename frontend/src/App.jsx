import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider }        from './context/SocketContext';
import Sidebar   from './components/layout/Sidebar';
import LandingPage from './pages/LandingPage';
import AuthPage  from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import InvestPro from './pages/InvestPro';
import FinAgentPage from './pages/FinAgentPage';
import Spinner   from './components/ui/Spinner';

function ComingSoon({ name }) {
  return (
    <div className="coming-soon">
      <div className="coming-icon">🚧</div>
      <h2>{name}</h2>
      <p>This module is under construction — coming soon!</p>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-center"><Spinner size={36} /></div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function AppShell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-center"><Spinner size={36} /></div>;
  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/finagent"  element={<FinAgentPage />} />
          <Route path="/investpro" element={<InvestPro />} />
          <Route path="/loans"     element={<ComingSoon name="Loans — EMI Calculator" />} />
          <Route path="/cards"     element={<ComingSoon name="Card Offers" />} />
          <Route path="/subscribe" element={<ComingSoon name="Sunscribe — Subscription Tracker" />} />
          <Route path="/ca"        element={<ComingSoon name="CA Contacts" />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          {/* Animated Background */}
          <div className="bg-blobs" aria-hidden="true">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
          </div>

          <Routes>
            <Route path="/"     element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={
              <Protected>
                <AppShell />
              </Protected>
            } />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
