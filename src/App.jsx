import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, TrendingUp } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BudgetPage from './pages/BudgetPage';
import ExpensesPage from './pages/ExpensesPage';
import YearlyPage from './pages/YearlyPage';
import SplitsPage from './pages/SplitsPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import './styles/global.css';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const { pages } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [triggerAddExpense, setTriggerAddExpense] = useState(false);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TrendingUp size={18} color="white" />
      </div>
      <div className="spinner" style={{ width: '24px', height: '24px' }} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <div className="mesh-bg" />

      <div className="mobile-header">
        <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px' }}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} color="white" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: '800' }}>FinFlow</span>
        </div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content" style={{ paddingTop: 'max(24px, calc(56px + 16px))' }}>
        <Routes>
          <Route path="/" element={<Dashboard onAddExpense={() => setTriggerAddExpense(true)} />} />
          <Route path="/budget" element={pages.budget !== false ? <BudgetPage /> : <Navigate to="/" replace />} />
          <Route path="/expenses" element={pages.expenses !== false ? (
            <ExpensesPage
              openAddModal={triggerAddExpense}
              onModalClose={() => setTriggerAddExpense(false)}
            />
          ) : <Navigate to="/" replace />} />
          <Route path="/yearly" element={pages.yearly !== false ? <YearlyPage /> : <Navigate to="/" replace />} />
          <Route path="/splits" element={pages.splits !== false ? <SplitsPage /> : <Navigate to="/" replace />} />
          <Route path="/goals" element={pages.goals !== false ? <GoalsPage /> : <Navigate to="/" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <SettingsProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              fontFamily: 'var(--font)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  </AuthProvider>
);

export default App;
