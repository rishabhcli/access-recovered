import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

export default function WorkspaceHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 px-6 py-4 flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h2 className="text-lg font-bold mb-1">Districts</h2>
          <p className="text-sm text-muted-foreground">Select a district to begin rehearsal.</p>
        </div>
        <Link to="/app/rehearsal/riverbend-east" className="block group">
          <div className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Riverbend East</h3>
                </div>
                <p className="text-sm text-muted-foreground">5 residential clusters · 2 critical facilities · 612 households</p>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive font-medium">Severe Flash Flood</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium">Moderate River Rise</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
            </div>
          </div>
        </Link>
        <div>
          <h2 className="text-lg font-bold mb-1">Recent Runs</h2>
          <p className="text-sm text-muted-foreground">No saved runs yet. Open a district to begin.</p>
        </div>
      </div>
    </div>
  );
}
