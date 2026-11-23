import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import { Logomark } from "./Icon";

export const Login = ({ onContinueAsGuest }: { onContinueAsGuest: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    // On success the auth listener in useTracker picks the session up and this screen goes away.
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <Logomark size={48} />
          <p className="eyebrow">PTE Class Coverage</p>
          <h1>PTE Tracker Login</h1>
          <p className="caption">Sign in with your Essay Architect credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field" htmlFor="email">
            <span className="field-label">Email</span>
            <input
              id="email"
              className="control"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              required
            />
          </label>
          <label className="field" htmlFor="password">
            <span className="field-label">Password</span>
            <input
              id="password"
              className="control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!supabase && (
            <p className="form-notice">
              Cloud Sync is currently unavailable. Please use Guest Mode.
            </p>
          )}
          <button type="submit" className="button primary block" disabled={loading || !supabase}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="button secondary block"
            onClick={onContinueAsGuest}
            disabled={loading}
          >
            Continue as Guest
          </button>
        </form>
        <p className="login-footer caption">
          Signing in syncs your data to your secure cloud profile. Guest mode keeps it in this
          browser.
        </p>
      </div>
    </main>
  );
};
