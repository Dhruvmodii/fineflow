import { useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';
import api from '../utils/api';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const DEFAULT_PAGES = {
  dashboard: true,
  budget: true,
  expenses: true,
  yearly: true,
  splits: true,
  goals: true,
};

const DEFAULT_SETTINGS = {
  currency: CURRENCIES[0],
  pages: DEFAULT_PAGES,
  compactMode: false,
  showBalanceOnDashboard: true,
  weekStartMonday: true,
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  // Load from Neon on mount
  useEffect(() => {
    const token = localStorage.getItem('finflow_token');
    if (!token) { setLoaded(true); return; }

    api.get('/settings').then(({ data }) => {
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettingsState(prev => ({
          ...DEFAULT_SETTINGS,
          ...data.settings,
          pages: { ...DEFAULT_PAGES, ...(data.settings.pages || {}) },
          currency: data.settings.currency || DEFAULT_SETTINGS.currency,
        }));
      }
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const setSettings = useCallback((update) => {
    setSettingsState(prev => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      // Debounce save to Neon — 600ms after last change
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api.put('/settings', next).catch(() => {});
      }, 600);
      return next;
    });
  }, []);

  if (!loaded) return null; // wait for settings before rendering app

  return (
    <SettingsContext.Provider value={{ ...settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
