"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
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
          Start your finance career
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Join thousands of students landing top finance roles
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium border"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          Continue with Google
        </button>
        <button
          className="h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium border"
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
          or
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
      </div>

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
            Full name
          </label>
          <input
            type="text"
            placeholder="James Taylor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>
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
            className="w-full h-10 px-3 rounded-lg text-sm outline-none border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-foreground)" }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none border"
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
          className="w-full h-10 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{
            background: "var(--color-brand-600)",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Spinner /> : "Create account"}
        </button>
        <p
          className="text-center text-xs"
          style={{ color: "var(--color-muted)" }}
        >
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </form>

      <p
        className="text-center text-sm"
        style={{ color: "var(--color-muted)" }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          Sign in
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
