import React, { useState } from "react";
import { supabase } from "../../infrastructure/supabase";
import "../../presentation/styles/App.css";

interface LoginProps {
  onLoginSuccess: () => void;
  onContinueAsGuest: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <h2>PTE Tracker Login</h2>
          <p>Sign in with your Essay Architect credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="guest-button"
            onClick={onContinueAsGuest}
            disabled={loading}
          >
            Continue as Guest
          </button>
        </form>
        <div className="login-footer">
          <p>Data will be synced to your secure cloud profile if you sign in.</p>
        </div>
      </div>
    </div>
  );
};
