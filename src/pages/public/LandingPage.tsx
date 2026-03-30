import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Shield, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-primary/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-display text-lg">Lifeline</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/replay/bridge-reconnect" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/app"
            className="text-sm px-4 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
            Workspace
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 topo-grid topo-contour opacity-40" />
        <div className="relative flex flex-col items-center justify-center min-h-[72vh] px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-gentle" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary/80 font-medium">
                Flood-Access Rehearsal
              </span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9]">
              <span className="block">Map the path</span>
              <span className="block text-primary/70">back to care</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Which single deployable action restores the most critical access to shelter and care first?
            </p>
            <p className="text-[11px] text-muted-foreground/40 tracking-wider uppercase">
              Scenario rehearsal tool · Not a live predictor
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link to="/app/rehearsal/riverbend-east"
                className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 transition-all">
                Open Board <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/replay/bridge-reconnect"
                className="flex items-center gap-2 px-6 py-3 border border-border rounded font-medium text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                Watch Replay
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Process strip */}
      <div className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-8 py-20">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Layers,
                step: '01',
                title: 'Flood disrupts access',
                desc: 'Apply a scenario. Roads fail. Clusters lose reachable paths to shelter and clinic.',
                color: 'text-destructive',
              },
              {
                icon: Shield,
                step: '02',
                title: 'Place one intervention',
                desc: 'Choose a bridge, clinic, barrier, or shuttle. Place it at a valid anchor point.',
                color: 'text-accent',
              },
              {
                icon: Eye,
                step: '03',
                title: 'Watch recovery unfold',
                desc: 'Routes restore in real time. See exactly how many households regain critical access.',
                color: 'text-primary',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/40">{s.step}</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <div className={`w-10 h-10 rounded bg-secondary flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <h3 className="font-display text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-8 py-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary/15 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            </div>
            <span className="font-display text-sm text-muted-foreground/60">Lifeline</span>
          </div>
          <p className="text-[11px] text-muted-foreground/40 max-w-sm text-right leading-relaxed">
            Scenario-based rehearsal for municipal resilience.
            Not real-time prediction or emergency dispatch.
          </p>
        </div>
      </footer>
    </div>
  );
}
