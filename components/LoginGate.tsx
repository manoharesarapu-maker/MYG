"use client";

/**
 * Demo-only login gate. Not real authentication -- it exists to match
 * the demo login flow described in the brief (guide / harbour2025) and
 * gives the app a production-shaped entry point. A real build would put
 * a proper auth provider here; see DECISIONS.md.
 */

import { useEffect, useState } from "react";

const SESSION_KEY = "guide-demo-authed";
const DEMO_USERNAME = "guide";
const DEMO_PASSWORD = "harbour2025";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "true");
  }, []);

  if (authed === null) {
    return null;
  }

  if (authed) {
    return <>{children}</>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthed(true);
      setError(null);
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="login-gate">
      <div className="login-card">
        <h1>Guide — City of Bayside Harbour</h1>
        <p>Demo access only. This is not a real council login.</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Sign in</button>
        </form>
        <p className="login-hint">Demo credentials: guide / harbour2025</p>
      </div>
    </div>
  );
}
