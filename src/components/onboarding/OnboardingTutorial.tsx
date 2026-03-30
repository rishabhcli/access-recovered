import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Layers, Shield, Zap, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Explore your district',
    description: 'Start by selecting a district to explore its infrastructure network.',
    detail: 'Each district contains nodes (shelters, clinics, supply hubs) connected by routes. You\'ll see which areas are healthy and which need attention.',
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'Run a flood scenario',
    description: 'Apply a disaster scenario to see how access routes break down.',
    detail: 'Scenarios are based on real elevation data and weather models. Watch as roads flood, bridges fail, and clusters become isolated.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Place an intervention',
    description: 'Choose a single deployable action — a bridge, barrier, or clinic — to restore access.',
    detail: 'Drag an intervention onto the board and see the simulation re-run in real time. Metrics update instantly to show your impact.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Save & share results',
    description: 'Save your run, compare scenarios, and share replay links with your team.',
    detail: 'Every run is versioned with full provenance. Invite colleagues, track activity in the audit log, and export results.',
  },
];

const STORAGE_KEY = 'lifeline-onboarding-completed';

export function useOnboardingState() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShow(true);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  return { show, complete, dismiss };
}

export function OnboardingTutorial({ onComplete, onDismiss }: { onComplete: () => void; onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md mx-4"
        >
          {/* Card */}
          <div className="rounded-lg border border-border bg-card paper-texture overflow-hidden">
            {/* Header with topo background */}
            <div className="relative px-6 pt-8 pb-6 topo-grid topo-contour">
              <button
                onClick={onDismiss}
                className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                    }`}
                  />
                ))}
                <span className="ml-auto text-[9px] font-mono text-muted-foreground/40 uppercase">
                  {step + 1} / {STEPS.length}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center text-primary mb-4">
                {current.icon}
              </div>

              <h2 className="font-display text-xl text-foreground">{current.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{current.description}</p>
            </div>

            {/* Detail */}
            <div className="px-6 py-5 border-t border-border/50">
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{current.detail}</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <button
                onClick={() => step > 0 && setStep(step - 1)}
                className={`text-xs text-muted-foreground/50 hover:text-foreground transition-colors ${step === 0 ? 'invisible' : ''}`}
              >
                ← Back
              </button>
              <button
                onClick={() => isLast ? onComplete() : setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Welcome label under card */}
          <div className="text-center mt-4">
            <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-widest">
              Welcome to Lifeline
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
