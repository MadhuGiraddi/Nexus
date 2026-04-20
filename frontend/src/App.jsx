import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider }        from './context/SocketContext';
import Sidebar   from './components/layout/Sidebar';
import LandingPage from './pages/LandingPage';
import AuthPage  from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import InvestPro from './pages/InvestPro';
import Subscription from './pages/Subscription';
import CardOffers from './pages/CardOffers';
import SubAnalyzer from './pages/SubAnalyzer';
import Spinner   from './components/ui/Spinner';

// CA Module Imports
import CADirectory from './pages/ca/CADirectory';
import CAProfile from './pages/ca/CAProfile';
import CAMyBookings from './pages/ca/MyBookings';
import ProGuard from './pages/ca/components/ProGuard';

// Loan Module Imports
import LoanLayout from './pages/loans/LoanLayout';
import LoanHome from './pages/loans/screens/Home';
import LoanApplication from './pages/loans/screens/Application';
import LoanAdvisor from './pages/loans/screens/AiAdvisor';
import LoanCalc from './pages/loans/screens/EmiCalculator';
import LoanTracker from './pages/loans/screens/Tracker';
import LoanScore from './pages/loans/screens/CreditScore';
import LoanRepayment from './pages/loans/screens/Repayment';

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
          <Route path="/finagent"  element={<ComingSoon name="FinAgent — AI Financial Assistant" />} />
          <Route path="/investpro" element={<InvestPro />} />
          <Route path="/cards"     element={<CardOffers />} />
          <Route path="/analyzer"  element={<SubAnalyzer />} />
          <Route path="/subscribe" element={<Subscription />} />
          <Route path="/ca"          element={<ProGuard><CADirectory /></ProGuard>} />
          <Route path="/ca/bookings" element={<ProGuard><CAMyBookings /></ProGuard>} />
          <Route path="/ca/:id"      element={<ProGuard><CAProfile /></ProGuard>} />
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
            <Route path="/loans" element={<Protected><LoanLayout /></Protected>}>
              <Route index element={<LoanHome />} />
              <Route path="apply" element={<LoanApplication />} />
              <Route path="advisor" element={<LoanAdvisor />} />
              <Route path="calc" element={<LoanCalc />} />
              <Route path="tracker"   element={<LoanTracker />} />
              <Route path="score"     element={<LoanScore />} />
              <Route path="repayment" element={<LoanRepayment />} />
              <Route path="*"         element={<Navigate to="/loans" replace />} />
            </Route>
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
