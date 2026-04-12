import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, PieChart, Receipt, Calendar, Users, LogOut, X, Target, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import toast from 'react-hot-toast';

const ALL_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { to: '/budget', icon: PieChart, label: 'Budget Planner', key: 'budget' },
  { to: '/expenses', icon: Receipt, label: 'Expenses', key: 'expenses' },
  { to: '/yearly', icon: Calendar, label: 'Yearly View', key: 'yearly' },
  { to: '/splits', icon: Users, label: 'Split Expenses', key: 'splits' },
  { to: '/goals', icon: Target, label: 'Goals', key: 'goals' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { pages } = useSettings();
  const navigate = useNavigate();

  const NAV = ALL_NAV.filter(n => pages[n.key] !== false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }} />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>FinFlow</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px', display: 'none' }} id="sidebar-close">
            <X size={16} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '10px', textDecoration: 'none', fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--accent3)' : 'var(--text2)',
                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                marginBottom: '2px', transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
          <NavLink
            to="/settings"
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', textDecoration: 'none', fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? 'var(--accent3)' : 'var(--text2)',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              marginBottom: '8px', transition: 'all 0.15s',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}
          >
            <Settings size={17} /> Settings
          </NavLink>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', marginBottom: '4px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: user?.avatar_color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
