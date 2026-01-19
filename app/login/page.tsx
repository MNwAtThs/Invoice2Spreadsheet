"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/app");
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <header className="auth-header">
          <Link href="/" className="auth-logo">
            <span className="logo-badge">
              <FileSpreadsheet size={40} />
            </span>
          </Link>
        </header>

        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in to continue to Invoice2Spreadsheet</p>

          <form className="auth-form" onSubmit={handleSignIn}>
            <label>
              Email
              <input
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary button-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
