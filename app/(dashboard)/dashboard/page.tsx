"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCVRecords,
  getInterviewRecords,
  getStreak,
  type CVRecord,
  type InterviewRecord,
} from "@/lib/storage";

const ROLE_LABELS: Record<string, string> = {
  spring_week: "Spring Week",
  summer_internship: "Summer Internship",
  graduate: "Graduate Role",
};

function scoreColor(s: number) {
  return s >= 75 ? "#4ade80" : s >= 55 ? "#f59e0b" : "#f87171";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const actions = [
  {
    href: "/cv-optimizer",
    title: "Analyse CV",
    description: "Get an AI score + finance-specific improvements in under 60 seconds.",
    icon: "📄",
    cta: "Upload CV",
    accent: "#4f46e5",
  },
  {
    href: "/interview-prep",
    title: "Mock Interview",
    description: "Practice with an AI interviewer tailored to your target firm and role.",
    icon: "🎙️",
    cta: "Start session",
    accent: "#7c3aed",
  },
  {
    href: "/resources",
    title: "Browse Resources",
    description: "Curated guides, templates, and tools for finance recruiting.",
    icon: "📚",
    cta: "Explore",
    accent: "#0891b2",
  },
];

export default function DashboardPage() {
  const [cvRecords, setCvRecords] = useState<CVRecord[]>([]);
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([]);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    setCvRecords(getCVRecords());
    setInterviewRecords(getInterviewRecords());
    setStreak(getStreak());
  }, []);

  const bestCvScore =
    cvRecords.length > 0
      ? Math.max(...cvRecords.map((r) => r.overallScore))
      : null;

  const avgInterviewScore =
    interviewRecords.length > 0
      ? Math.round(
          interviewRecords.reduce((sum, r) => sum + r.overallScore, 0) /
            interviewRecords.length
        )
      : null;

  const stats = [
    {
      label: "Best CV Score",
      value: bestCvScore !== null ? String(bestCvScore) : "--",
      color: bestCvScore !== null ? scoreColor(bestCvScore) : "#818cf8",
    },
    {
      label: "Interviews Done",
      value: String(interviewRecords.length),
      color: "#a78bfa",
    },
    {
      label: "Avg Interview Score",
      value: avgInterviewScore !== null ? String(avgInterviewScore) : "--",
      color: avgInterviewScore !== null ? scoreColor(avgInterviewScore) : "#34d399",
    },
    {
      label: "Day Streak",
      value: String(streak),
      color: "#fb923c",
    },
  ];

  const recentCvs = cvRecords.slice(0, 3);
  const recentInterviews = interviewRecords.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-foreground)" }}
        >
          Good evening, Archie
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Ready to accelerate your finance career? Start with a CV analysis or mock interview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--color-muted)" }}
            >
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent CV Analyses */}
        <div
          className="rounded-xl border p-5"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-foreground)" }}
            >
              Recent CV Analyses
            </h3>
            <Link
              href="/cv-optimizer"
              className="text-xs"
              style={{ color: "var(--color-brand-400)" }}
            >
              + New
            </Link>
          </div>

          {recentCvs.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              No CVs analysed yet — upload one in CV Optimizer
            </p>
          ) : (
            <div className="space-y-2">
              {recentCvs.map((r) => {
                const c = scoreColor(r.overallScore);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg p-3 border"
                    style={{
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {r.fileName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        {formatDate(r.date)}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold ml-3 flex-shrink-0"
                      style={{ color: c }}
                    >
                      {r.overallScore}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Interviews */}
        <div
          className="rounded-xl border p-5"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-foreground)" }}
            >
              Recent Interviews
            </h3>
            <Link
              href="/interview-prep"
              className="text-xs"
              style={{ color: "var(--color-brand-400)" }}
            >
              + New
            </Link>
          </div>

          {recentInterviews.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              No interviews completed yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentInterviews.map((r) => {
                const c = scoreColor(r.overallScore);
                const roleLabel = ROLE_LABELS[r.role] ?? r.role;
                const title = r.firm ? `${roleLabel} · ${r.firm}` : roleLabel;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg p-3 border"
                    style={{
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        {formatDate(r.date)}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold ml-3 flex-shrink-0"
                      style={{ color: c }}
                    >
                      {r.overallScore}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3
          className="text-sm font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-muted)" }}
        >
          Get started
        </h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl p-5 border flex flex-col gap-3 transition-all hover:border-brand-700"
              style={{
                background: "var(--color-surface-1)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="text-2xl">{a.icon}</div>
              <div>
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {a.title}
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-muted)" }}
                >
                  {a.description}
                </p>
              </div>
              <span
                className="text-xs font-semibold self-start px-3 py-1.5 rounded-lg"
                style={{ background: `${a.accent}22`, color: a.accent }}
              >
                {a.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
