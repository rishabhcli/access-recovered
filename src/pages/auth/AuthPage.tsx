import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/app', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isSignUp
        ? await signUp(email, password, fullName)
        : await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
      } else if (!isSignUp) {
        navigate('/app');
      } else {
        setError('Check your email to confirm your account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs mb-4">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{isSignUp ? 'Create account' : 'Sign in to Lifeline'}</h1>
          <p className="text-sm text-muted-foreground">Access the rehearsal board</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="planner@city.gov" required
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={loading}
            className="block w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm text-center hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p className="text-[11px] text-center text-muted-foreground/60">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="underline hover:text-foreground">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
