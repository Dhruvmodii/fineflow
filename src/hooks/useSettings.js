import { useState, useCallback, createContext, useContext } from 'react';

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
  theme: 'dark',
  compactMode: false,
  showBalanceOnDashboard: true,
  weekStartMonday: true,
  defaultExpenseCategory: 'Food & Groceries',
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const load = () => {
    try {
      const raw = localStorage.getItem('finflow_settings');
      if (!raw) return DEFAULT_SETTINGS;
      const saved = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        pages: { ...DEFAULT_PAGES, ...saved.pages },
        currency: saved.currency || DEFAULT_SETTINGS.currency,
      };
    } catch { return DEFAULT_SETTINGS; }
  };

  const [settings, setSettingsState] = useState(load);

  const setSettings = useCallback((update) => {
    setSettingsState(prev => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      localStorage.setItem('finflow_settings', JSON.stringify(next));
      return next;
    });
  }, []);

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
