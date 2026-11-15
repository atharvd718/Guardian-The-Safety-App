import React, { createContext, useContext, useEffect, useState } from 'react';

export type GuardianTheme = 'blush' | 'cream' | 'velvet';

export const THEME_OPTIONS: {
  id: GuardianTheme;
  label: string;
  swatch: string;
  themeColor: string;
}[] = [
  { id: 'blush', label: 'Blush Rose', swatch: '#FAF5F7', themeColor: '#C2185B' },
  { id: 'cream', label: 'Rose Cream', swatch: '#FAF4EE', themeColor: '#9E2A55' },
  { id: 'velvet', label: 'Velvet Night', swatch: '#18131B', themeColor: '#18131B' },
];

interface ThemeContextValue {
  theme: GuardianTheme;
  setTheme: (theme: GuardianTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'blush',
  setTheme: () => {},
  cycleTheme: () => {},
});

const THEME_STORAGE_KEY = 'guardian_color_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<GuardianTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as GuardianTheme | null;
      if (saved === 'blush' || saved === 'cream' || saved === 'velvet') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'blush';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const match = THEME_OPTIONS.find((t) => t.id === theme);
    if (metaTheme && match) {
      metaTheme.setAttribute('content', match.themeColor);
    }
  }, [theme]);

  const setTheme = (next: GuardianTheme) => setThemeState(next);

  const cycleTheme = () => {
    const order: GuardianTheme[] = ['blush', 'cream', 'velvet'];
    const nextIdx = (order.indexOf(theme) + 1) % order.length;
    setThemeState(order[nextIdx]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useGuardianTheme() {
  return useContext(ThemeContext);
}
