import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import { Logomark } from "./Icon";

export const Login = ({ onContinueAsGuest }: { onContinueAsGuest: () => void }) => {
  const [step, setStep] = useState<"choose" | "email">("choose");
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

  const showStep = (next: "choose" | "email") => {
    setError(null);
    setStep(next);
  };

  return (
    <main className="signin">
      <div className="signin-sky" aria-hidden="true" />
      <div className="signin-panel">
        <div className="signin-brand">
          <Logomark size={34} />
          <h1>PTE Class Coverage</h1>
        </div>

        {error && (
          <p className="signin-error" role="alert">
            {error}
          </p>
        )}
        {!supabase && (
          <p className="signin-note">Cloud Sync is currently unavailable. Please use Guest Mode.</p>
        )}

        {step === "choose" ? (
          <div className="signin-actions">
            <button
              type="button"
              className="pill dim"
              onClick={() => showStep("email")}
              disabled={!supabase}
            >
              Continue with email
            </button>
            <button type="button" className="signin-link" onClick={onContinueAsGuest}>
              Continue as Guest
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="signin-actions">
            <input
              className="pill-input"
              type="email"
              aria-label="Email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            <input
              className="pill-input"
              type="password"
              aria-label="Password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="pill light" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              className="signin-link"
              onClick={() => showStep("choose")}
              disabled={loading}
            >
              Back to sign-in options
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
