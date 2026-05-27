"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 150));

    document.cookie = `sb-access-token=mock-${Date.now()}; path=/; max-age=${60 * 60 * 24 * 30}`;
    localStorage.setItem("fn_user_email", email.trim());

    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-foreground)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Sign in to your Fintern Navigator account
        </p>
      </div>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          <GoogleIcon />
          Google
        </button>
        <button
          className="h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors border"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
          or continue with email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <p
            className="text-sm px-3 py-2 rounded-lg"
            style={{
              color: "#f87171",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-foreground)" }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="you@university.ac.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none border transition-colors"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-foreground)" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs transition-colors"
              style={{ color: "var(--color-muted)" }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none border transition-colors"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
          style={{
            background: "var(--color-brand-600)",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Spinner /> : "Sign in"}
        </button>
      </form>

      <p
        className="text-center text-sm"
        style={{ color: "var(--color-muted)" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
