import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs mb-4">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to Lifeline</h1>
          <p className="text-sm text-muted-foreground">Access the rehearsal board</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Email</label>
            <input type="email" placeholder="planner@city.gov"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Password</label>
            <input type="password" placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
          </div>
          <Link to="/app/rehearsal/riverbend-east"
            className="block w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm text-center hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
        </div>
        <p className="text-[11px] text-center text-muted-foreground/60">
          Full authentication requires Lovable Cloud.<br />For now, access the board directly.
        </p>
      </div>
    </div>
  );
}
