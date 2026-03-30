import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Eye } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <span className="text-sm font-bold tracking-[0.2em] uppercase">Lifeline</span>
        <div className="flex gap-4">
          <Link to="/replay/bridge-reconnect" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Replay Demo</Link>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Workspace</Link>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center min-h-[75vh] px-8 text-center">
        <div className="mb-5">
          <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
            Flood-Access Rehearsal Board
          </span>
        </div>
        <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">LIFELINE</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-2 leading-relaxed">
          Which single deployable action restores the most critical access to shelter and care first?
        </p>
        <p className="text-xs text-muted-foreground/50 mb-10 tracking-wide">
          Scenario-based rehearsal tool · Not a live flood predictor
        </p>
        <div className="flex gap-4">
          <Link to="/app/rehearsal/riverbend-east"
            className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Open Rehearsal Board <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/replay/bridge-reconnect"
            className="flex items-center gap-2 px-7 py-3.5 border border-border rounded-lg font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            View Replay Demo
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-20">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: Zap, color: 'destructive', title: 'Flood disrupts access', desc: 'Apply a flood scenario. Watch roads fail and clusters lose access to shelter and care.' },
            { icon: Shield, color: 'accent', title: 'Place one intervention', desc: 'Choose a temporary bridge, mobile clinic, barrier, or shuttle. Place it at a valid anchor.' },
            { icon: Eye, color: 'primary', title: 'See the network recover', desc: 'Routes restore. Metrics update. See exactly how many households regain critical access.' },
          ].map((s, i) => (
            <div key={i} className="text-center space-y-3">
              <div className={`w-11 h-11 rounded-full bg-${s.color}/10 flex items-center justify-center mx-auto`}>
                <s.icon className={`w-5 h-5 text-${s.color}`} />
              </div>
              <h3 className="font-semibold text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-border/50 px-8 py-8 text-center">
        <p className="text-[11px] text-muted-foreground/60 max-w-md mx-auto leading-relaxed">
          Lifeline is a scenario-based rehearsal tool for municipal resilience planning.
          It does not provide real-time flood prediction or emergency dispatch.
        </p>
      </footer>
    </div>
  );
}
