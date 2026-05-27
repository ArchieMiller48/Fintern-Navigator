"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/cv-optimizer", label: "CV Optimizer", icon: FileIcon },
  { href: "/interview-prep", label: "Interview Prep", icon: MicIcon },
  { href: "/resources", label: "Resources", icon: BookIcon },
  { href: "/progress", label: "My Progress", icon: BarIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem("fn_user_email"));
  }, []);

  function handleLogout() {
    document.cookie = "sb-access-token=; path=/; max-age=0";
    localStorage.removeItem("fn_user_email");
    window.location.href = "/login";
  }

  // Derive initials from email (first letter) or fallback
  const initials = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 fixed top-0 left-0 h-screen z-10 border-r"
        style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b gap-2.5" style={{ borderColor: "var(--color-border)" }}>
          <div className="size-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">FN</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>Fintern Navigator</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--color-surface-3)" : "transparent",
                  color: active ? "var(--color-brand-300)" : "var(--color-muted)",
                }}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade */}
        <div className="p-3">
          <Link
            href="/pricing"
            className="block rounded-xl p-3 border cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: "rgba(99,102,241,0.05)",
              borderColor: "rgba(99,102,241,0.2)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-brand-400)"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span className="text-xs font-semibold" style={{ color: "var(--color-brand-300)" }}>Upgrade to Pro</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>Unlimited AI analyses + advanced features</p>
          </Link>
        </div>

        {/* User */}
        <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3 p-3 pb-2">
            <div
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                {userEmail ?? "—"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>Free plan</p>
            </div>
          </div>
          {/* Logout button */}
          <div className="px-3 pb-3">
            <button
              onClick={handleLogout}
              className="w-full h-8 flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors border"
              style={{
                background: "transparent",
                borderColor: "var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-60 flex-1 flex flex-col">
        {/* Topbar */}
        <header
          className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-9"
          style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
        >
          <div>
            <h1 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
              {NAV.find((n) => pathname.startsWith(n.href))?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>Fintern Navigator</p>
          </div>
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            {initials}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-brand-400)" : "currentColor"} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function FileIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-brand-400)" : "currentColor"} strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-brand-400)" : "currentColor"} strokeWidth="2">
      <path d="M12 1a3 3 0 100 6 3 3 0 000-6z"/><path d="M19 9H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2z"/>
    </svg>
  );
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-brand-400)" : "currentColor"} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
}
function BarIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-brand-400)" : "currentColor"} strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
