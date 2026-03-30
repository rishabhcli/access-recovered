import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ResolvedTheme = 'dark' | 'light';

const ThemeContext = createContext<{ resolved: ResolvedTheme }>({ resolved: 'dark' });

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolved, setResolved] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    const apply = (t: ResolvedTheme) => {
      setResolved(t);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(t);
    };
    apply(getSystemTheme());
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => apply(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
