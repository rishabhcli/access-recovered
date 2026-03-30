import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

const icons = { dark: Sun, light: Moon, system: Monitor } as const;
const labels = { dark: 'Switch to light', light: 'Switch to system', system: 'Switch to dark' } as const;

export function ThemeToggle() {
  const { choice, cycle } = useTheme();
  const Icon = icons[choice];
  return (
    <button
      onClick={cycle}
      className="relative w-8 h-8 rounded-md border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      aria-label={labels[choice]}
      title={labels[choice]}
    >
      <motion.div
        key={choice}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.div>
    </button>
  );
}
