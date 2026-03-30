import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeChoice = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeCtx {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  choice: 'system',
  resolved: 'dark',
  setChoice: () => {},
  cycle: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolve(choice: ThemeChoice): ResolvedTheme {
  return choice === 'system' ? getSystemTheme() : choice;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lifeline-theme') as ThemeChoice) || 'system';
    }
    return 'system';
  });

  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(choice));

  useEffect(() => {
    const r = resolve(choice);
    setResolved(r);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(r);
    localStorage.setItem('lifeline-theme', choice);
  }, [choice]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (choice !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const r = getSystemTheme();
      setResolved(r);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [choice]);

  const setChoice = (c: ThemeChoice) => setChoiceState(c);
  const cycle = () => setChoiceState(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark');

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
