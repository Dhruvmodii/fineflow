import React from 'react';
import { Check, Globe, Layout, Eye, EyeOff, Palette, Settings2, Bell, BarChart2 } from 'lucide-react';
import { useSettings, CURRENCIES } from '../hooks/useSettings';

const Toggle = ({ value, onChange, label, description, icon: Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
      {Icon && <div style={{ width: '34px', height: '34px', background: 'rgba(99,102,241,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={16} color="var(--accent3)" /></div>}
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>{description}</div>}
      </div>
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, marginLeft: '12px', background: value ? 'var(--accent)' : 'var(--bg2)', transition: 'all 0.2s', boxShadow: value ? '0 0 12px rgba(99,102,241,0.4)' : 'none' }}
    >
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
    </button>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '28px' }}>
    <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {title}
    </h3>
    {children}
  </div>
);

const PAGE_META = {
  dashboard: { label: 'Dashboard', emoji: '🏠', desc: 'Overview & stats' },
  budget: { label: 'Budget Planner', emoji: '📊', desc: 'Plan your monthly budget' },
  expenses: { label: 'Expenses', emoji: '💸', desc: 'Track all transactions' },
  yearly: { label: 'Yearly View', emoji: '📅', desc: 'Annual expense summary' },
  splits: { label: 'Split Expenses', emoji: '👥', desc: 'Split bills with others' },
  goals: { label: 'Goals', emoji: '🎯', desc: 'Save for your dreams' },
};

const SettingsPage = () => {
  const { currency, pages, compactMode, showBalanceOnDashboard, weekStartMonday, setSettings } = useSettings();

  const updatePages = (key, val) => setSettings(s => ({ ...s, pages: { ...s.pages, [key]: val } }));

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Customize your FinFlow experience</p>
      </div>

      {/* Currency */}
      <Section title="💱 Currency">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSettings(s => ({ ...s, currency: c }))}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: currency.code === c.code ? 'rgba(99,102,241,0.2)' : 'var(--bg3)',
                outline: currency.code === c.code ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent',
                fontFamily: 'var(--font)', transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '18px', fontFamily: 'var(--mono)', fontWeight: '700', color: currency.code === c.code ? 'var(--accent3)' : 'var(--text2)', width: '28px' }}>{c.symbol}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: currency.code === c.code ? 'var(--text)' : 'var(--text2)' }}>{c.code}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{c.name.split(' ')[0]}</div>
              </div>
              {currency.code === c.code && <Check size={14} color="var(--accent3)" style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* Page Visibility */}
      <Section title="📄 Page Visibility">
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px' }}>Toggle pages on/off. Hidden pages won't appear in navigation.</p>
        {Object.entries(PAGE_META).map(([key, meta]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '8px', opacity: key === 'dashboard' ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{meta.emoji}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{meta.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{meta.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {key !== 'dashboard' && (
                <span style={{ fontSize: '12px', color: pages[key] ? 'var(--green)' : 'var(--text3)' }}>
                  {pages[key] ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> Visible</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><EyeOff size={12} /> Hidden</span>}
                </span>
              )}
              <button
                disabled={key === 'dashboard'}
                onClick={() => key !== 'dashboard' && updatePages(key, !pages[key])}
                style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: key === 'dashboard' ? 'not-allowed' : 'pointer', position: 'relative', background: pages[key] ? 'var(--accent)' : 'var(--bg2)', transition: 'all 0.2s', boxShadow: pages[key] ? '0 0 12px rgba(99,102,241,0.4)' : 'none' }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: pages[key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* Display Preferences */}
      <Section title="🎨 Display Preferences">
        <Toggle
          value={compactMode}
          onChange={v => setSettings(s => ({ ...s, compactMode: v }))}
          label="Compact Mode"
          description="Reduce spacing for more content on screen"
          icon={Layout}
        />
        <Toggle
          value={showBalanceOnDashboard}
          onChange={v => setSettings(s => ({ ...s, showBalanceOnDashboard: v }))}
          label="Show Balance on Dashboard"
          description="Display your remaining balance prominently"
          icon={BarChart2}
        />
        <Toggle
          value={weekStartMonday}
          onChange={v => setSettings(s => ({ ...s, weekStartMonday: v }))}
          label="Week Starts on Monday"
          description="Change the first day of the week in date pickers"
          icon={Settings2}
        />
      </Section>

      {/* App Info */}
      <Section title="ℹ️ About">
        <div style={{ background: 'var(--bg3)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>FinFlow</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Personal Finance Tracker</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.6' }}>
            Track expenses, plan budgets, set goals, and take control of your finances — all in one place.
          </div>
        </div>
      </Section>
    </div>
  );
};

export default SettingsPage;
