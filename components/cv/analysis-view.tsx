"use client";

import { useState, useEffect } from "react";

type Tab = "overview" | "bullets" | "keywords" | "actions" | "finance";

type Analysis = {
  overallScore: number;
  atsScore: number;
  contentScore: number;
  formatScore: number;
  keywordScore: number;
  impactScore: number;
  scoreRationale: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  presentKeywords: string[];
  criticalIssues: string[];
  bulletImprovements: Array<{ original: string; improved: string; explanation: string }>;
  immediateActions: Array<{ title: string; description: string; scoreImpact: string; priority: string }>;
  financeIntel: {
    dealExperience: { status: string; comment: string };
    technicalSkills: { status: string; comment: string };
    prestige: { status: string; comment: string };
    leadershipNarrative: { status: string; comment: string };
  };
};

type Props = { fileName: string; file?: File | null; analysis: Analysis; onBack: () => void };

export default function CvAnalysisView({ fileName, file, analysis, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [barsLoaded, setBarsLoaded] = useState(false);
  const [bulletStates, setBulletStates] = useState<Record<number, "idle" | "shown" | "accepted">>(
    Object.fromEntries(analysis.bulletImprovements.map((_, i) => [i, "idle"]))
  );
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let n = 0;
    const interval = setInterval(() => {
      n = Math.min(n + 2, analysis.overallScore);
      setScoreDisplay(n);
      if (n >= analysis.overallScore) clearInterval(interval);
    }, 22);
    const t = setTimeout(() => setBarsLoaded(true), 200);
    return () => { clearInterval(interval); clearTimeout(t); };
  }, [analysis.overallScore]);

  function showBullet(i: number) {
    setBulletStates((s) => ({ ...s, [i]: "shown" }));
  }
  function acceptBullet(i: number) {
    setBulletStates((s) => ({ ...s, [i]: "accepted" }));
  }
  function dismissBullet(i: number) {
    setBulletStates((s) => ({ ...s, [i]: "idle" }));
  }

  async function downloadUpdated() {
    if (!file) return;
    const accepted = analysis.bulletImprovements.filter((_, i) => bulletStates[i] === "accepted");
    if (accepted.length === 0) return;

    setDownloading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("replacements", JSON.stringify(accepted.map(({ original, improved }) => ({ original, improved }))));

      const res = await fetch("/api/cv/export", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+?)"/);
      a.download = match ? match[1] : "updated-cv.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  const circumference = 2 * Math.PI * 64;
  const offset = circumference * (1 - scoreDisplay / 100);

  const scoreColor =
    analysis.overallScore >= 75 ? "#4ade80" :
    analysis.overallScore >= 55 ? "#f59e0b" : "#f87171";

  const scoreLabel =
    analysis.overallScore >= 75 ? "Strong" :
    analysis.overallScore >= 55 ? "Good Progress" : "Needs Improvement";

  const SCORES = [
    { label: "ATS Compatibility",  val: analysis.atsScore,     color: analysis.atsScore >= 70 ? "#22c55e" : analysis.atsScore >= 50 ? "#f59e0b" : "#ef4444" },
    { label: "Content Quality",    val: analysis.contentScore, color: analysis.contentScore >= 70 ? "#22c55e" : analysis.contentScore >= 50 ? "#f59e0b" : "#ef4444" },
    { label: "Formatting",         val: analysis.formatScore,  color: analysis.formatScore >= 70 ? "#22c55e" : analysis.formatScore >= 50 ? "#f59e0b" : "#ef4444" },
    { label: "Finance Keywords",   val: analysis.keywordScore, color: analysis.keywordScore >= 70 ? "#22c55e" : analysis.keywordScore >= 50 ? "#f59e0b" : "#ef4444" },
    { label: "Quantified Impact",  val: analysis.impactScore,  color: analysis.impactScore >= 70 ? "#22c55e" : analysis.impactScore >= 50 ? "#f59e0b" : "#ef4444" },
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bullets",  label: "Bullet Editor" },
    { id: "keywords", label: "Keywords" },
    { id: "actions",  label: "Action Plan" },
    { id: "finance",  label: "Finance Intel" },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>{fileName}</h2>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              AI-powered finance recruiting analysis · just now
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: `${scoreColor}22`,
            border: `1px solid ${scoreColor}44`,
            color: scoreColor,
          }}
        >
          {scoreLabel}
        </div>
      </div>

      {/* Score + breakdown */}
      <div className="grid lg:grid-cols-[250px_1fr] gap-4">
        {/* Ring */}
        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-muted)" }}>
            Overall Score
          </p>
          <div className="relative inline-block mb-4">
            <svg width="150" height="150" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-surface-3)" strokeWidth="8"/>
              <circle
                cx="80" cy="80" r="64" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke={`url(#grad-${analysis.overallScore})`}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }}
              />
              <defs>
                <linearGradient id={`grad-${analysis.overallScore}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={scoreColor} stopOpacity="0.6"/>
                  <stop offset="100%" stopColor={scoreColor}/>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: scoreColor }}>{scoreDisplay}</span>
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>/100</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {analysis.scoreRationale}
          </p>
        </div>

        {/* Bars */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--color-muted)" }}>
            Score Breakdown
          </p>
          <div className="space-y-4">
            {SCORES.map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm" style={{ color: "var(--color-foreground)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color }}>{val}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--color-surface-3)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: barsLoaded ? `${val}%` : "0%",
                      background: color,
                      transition: "width 1.1s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical issues */}
      {analysis.criticalIssues.length > 0 && analysis.criticalIssues[0] && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "rgba(239,68,68,.07)", borderColor: "rgba(239,68,68,.2)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="font-semibold mb-1" style={{ color: "#f87171" }}>
              {analysis.criticalIssues.length} critical {analysis.criticalIssues.length === 1 ? "issue" : "issues"} found
            </p>
            <ul className="space-y-0.5">
              {analysis.criticalIssues.map((issue, i) => (
                <li key={i} className="text-xs" style={{ color: "#fca5a5" }}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
      >
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-5 py-3.5 text-sm font-medium whitespace-nowrap shrink-0"
              style={{
                color: tab === id ? "var(--color-brand-300)" : "var(--color-muted)",
                borderBottom: tab === id ? "2px solid var(--color-brand-500)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {id === "actions" ? (
                <span className="flex items-center gap-1.5">
                  Action Plan
                  <span className="px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: "#ef4444", fontSize: "10px" }}>
                    {analysis.immediateActions.length}
                  </span>
                </span>
              ) : label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-5">
              <Section title="Strengths" color="#4ade80" check>
                {analysis.strengths.map((s, i) => <BulletItem key={i} text={s} color="#4ade80" />)}
              </Section>
              <Section title="Weaknesses" color="#f87171">
                {analysis.weaknesses.map((w, i) => <BulletItem key={i} text={w} color="#f87171" />)}
              </Section>
            </div>
          )}

          {/* ── BULLET EDITOR ── */}
          {tab === "bullets" && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                    Inline Bullet Editor
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                    Accept changes to update your document
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const acceptedCount = Object.values(bulletStates).filter((s) => s === "accepted").length;
                    return acceptedCount > 0 && file ? (
                      <button
                        onClick={downloadUpdated}
                        disabled={downloading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                        style={{ background: downloading ? "var(--color-surface-3)" : "#16a34a", opacity: downloading ? 0.7 : 1 }}
                      >
                        {downloading ? (
                          <>
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            Exporting…
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download Updated CV ({acceptedCount})
                          </>
                        )}
                      </button>
                    ) : null;
                  })()}
                  <button
                    onClick={() => analysis.bulletImprovements.forEach((_, i) => showBullet(i))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: "var(--color-brand-600)" }}
                  >
                    ↺ Show All
                  </button>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
                {analysis.bulletImprovements.map((b, i) => {
                  const state = bulletStates[i];
                  return (
                    <div
                      key={i}
                      className="border-b last:border-b-0 px-4 py-3.5"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface-2)" }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="size-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--color-muted)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed" style={{ color: state === "accepted" ? "#86efac" : "var(--color-foreground)" }}>
                            {state === "accepted" ? b.improved : b.original}
                          </p>

                          {state === "shown" && (
                            <div
                              className="mt-3 p-3 rounded-lg border"
                              style={{ background: "rgba(99,102,241,.05)", borderColor: "rgba(99,102,241,.2)" }}
                            >
                              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-brand-400)" }}>
                                ✨ AI Suggestion
                              </p>
                              <p className="text-sm leading-relaxed mb-1.5" style={{ color: "#c7d2fe" }}>
                                {b.improved}
                              </p>
                              <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>
                                {b.explanation}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => acceptBullet(i)}
                                  className="px-3 py-1 rounded-md text-xs font-semibold text-white"
                                  style={{ background: "var(--color-brand-600)" }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => dismissBullet(i)}
                                  className="px-3 py-1 rounded-md text-xs border"
                                  style={{ background: "var(--color-surface-3)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {state === "idle" && (
                          <button
                            onClick={() => showBullet(i)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border"
                            style={{ background: "var(--color-surface-3)", borderColor: "var(--color-border)", color: "var(--color-brand-300)" }}
                          >
                            ✨ Improve
                          </button>
                        )}
                        {state === "accepted" && (
                          <div
                            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border"
                            style={{ background: "rgba(34,197,94,.1)", borderColor: "rgba(34,197,94,.2)", color: "#4ade80" }}
                          >
                            ✓ Accepted
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── KEYWORDS ── */}
          {tab === "keywords" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "#f87171" }}>✗ Missing Keywords</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(239,68,68,.1)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)" }}
                  >
                    {analysis.missingKeywords.length} missing
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>
                  High-value finance keywords absent from your CV. Adding these improves your ATS pass rate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((k) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "#4ade80" }}>✓ Present Keywords</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(34,197,94,.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,.2)" }}
                  >
                    {analysis.presentKeywords.length} found
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>
                  Finance-relevant keywords already present in your CV.
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.presentKeywords.map((k) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", color: "#86efac" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ACTION PLAN ── */}
          {tab === "actions" && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Prioritised fixes ranked by impact. Complete high-priority items first.
              </p>
              {analysis.immediateActions.map((action, i) => {
                const p = action.priority.toLowerCase();
                const style =
                  p === "high"   ? { color: "#f87171", bg: "rgba(239,68,68,.1)",  border: "rgba(239,68,68,.2)" } :
                  p === "medium" ? { color: "#fbbf24", bg: "rgba(251,191,36,.1)", border: "rgba(251,191,36,.2)" } :
                                   { color: "#4ade80", bg: "rgba(34,197,94,.1)",  border: "rgba(34,197,94,.2)" };
                return (
                  <div
                    key={i}
                    className="flex gap-3 p-4 rounded-xl border"
                    style={{ background: "var(--color-surface-2)", borderColor: style.border }}
                  >
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-md self-start whitespace-nowrap"
                      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                    >
                      {p.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
                        {action.title}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {action.description}{" "}
                        <span style={{ color: "#4ade80", fontWeight: 600 }}>
                          Score impact: {action.scoreImpact}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FINANCE INTEL ── */}
          {tab === "finance" && (
            <div className="grid lg:grid-cols-2 gap-4">
              {Object.entries(analysis.financeIntel).map(([key, val]) => {
                const titles: Record<string, string> = {
                  dealExperience:     "Deal Experience",
                  technicalSkills:    "Technical Skills",
                  prestige:           "Prestige Signal",
                  leadershipNarrative:"Leadership Narrative",
                };
                const icons: Record<string, string> = {
                  dealExperience: "◈", technicalSkills: "⚡", prestige: "🏆", leadershipNarrative: "👥",
                };
                const s = val.status;
                const statusStyle =
                  s === "Strong"
                    ? { color: "#4ade80", bg: "rgba(34,197,94,.1)",  border: "rgba(34,197,94,.2)" }
                    : s === "Partial" || s === "Needs depth"
                    ? { color: "#fbbf24", bg: "rgba(251,191,36,.1)", border: "rgba(251,191,36,.2)" }
                    : { color: "#f87171", bg: "rgba(239,68,68,.1)",  border: "rgba(239,68,68,.2)" };
                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border"
                    style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ color: "var(--color-brand-400)" }}>{icons[key]}</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--color-brand-300)" }}>
                        {titles[key]}
                      </span>
                    </div>
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-md mb-2.5"
                      style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color }}
                    >
                      {s}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                      {val.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Section({ title, color, check, children }: { title: string; color: string; check?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="size-5 rounded-md flex items-center justify-center" style={{ background: `${color}22` }}>
          {check
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </div>
        <span className="text-sm font-semibold" style={{ color }}>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BulletItem({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-lg border"
      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)" }}
    >
      <div className="size-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-foreground)" }}>{text}</p>
    </div>
  );
}
