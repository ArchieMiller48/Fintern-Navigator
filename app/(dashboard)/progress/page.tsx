"use client";

import { useEffect, useState } from "react";
import { getCVRecords, getInterviewRecords, type CVRecord, type InterviewRecord } from "@/lib/storage";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 75) return "#4ade80";
  if (s >= 55) return "#f59e0b";
  return "#f87171";
}

function scoreBg(s: number) {
  if (s >= 75) return "rgba(74,222,128,.12)";
  if (s >= 55) return "rgba(245,158,11,.12)";
  return "rgba(248,113,113,.12)";
}

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

function fmtShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

/* ─── Mini sparkline ──────────────────────────────────────────────────────── */
function Sparkline({ points, color }: { points: { date: string; score: number }[]; color: string }) {
  if (points.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 140 }}>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>Need at least 2 sessions to show trend</p>
      </div>
    );
  }

  const W = 400;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const scores = points.map((p) => p.score);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (s: number) => PAD.top + innerH - ((s - minS) / (maxS - minS)) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.score).toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  // Y axis ticks
  const yTicks = [minS, Math.round((minS + maxS) / 2), maxS].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140, display: "block" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left} y1={toY(t).toFixed(1)}
            x2={W - PAD.right} y2={toY(t).toFixed(1)}
            stroke="var(--color-border)" strokeWidth="1"
          />
          <text
            x={PAD.left - 6} y={toY(t)} dy="0.35em"
            textAnchor="end" fontSize="9" fill="var(--color-muted)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.score)} r="3.5" fill={color} />
          {/* X axis date */}
          {(i === 0 || i === points.length - 1 || points.length <= 5) && (
            <text
              x={toX(i)} y={H - 6}
              textAnchor="middle" fontSize="8.5" fill="var(--color-muted)"
            >
              {fmtShort(p.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─── Sub-score bar ───────────────────────────────────────────────────────── */
function SubBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs truncate" style={{ color: "var(--color-muted)" }}>{label}</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(value) }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-3)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ProgressPage() {
  const [cvRecords, setCvRecords] = useState<CVRecord[]>([]);
  const [ivRecords, setIvRecords] = useState<InterviewRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedCv, setExpandedCv] = useState<string | null>(null);
  const [expandedIv, setExpandedIv] = useState<string | null>(null);

  useEffect(() => {
    setCvRecords(getCVRecords());
    setIvRecords(getInterviewRecords());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-500)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const hasAnything = cvRecords.length > 0 || ivRecords.length > 0;

  // Trend data — oldest first
  const cvTrend = [...cvRecords].reverse().map((r) => ({ date: r.date, score: r.overallScore }));
  const ivTrend = [...ivRecords].reverse().map((r) => ({ date: r.date, score: r.overallScore }));

  const bestCv = cvRecords.length ? Math.max(...cvRecords.map((r) => r.overallScore)) : null;
  const bestIv = ivRecords.length ? Math.max(...ivRecords.map((r) => r.overallScore)) : null;
  const avgCv = cvRecords.length ? avg(cvRecords.map((r) => r.overallScore)) : null;
  const avgIv = ivRecords.length ? avg(ivRecords.map((r) => r.overallScore)) : null;

  const ROLE_LABELS: Record<string, string> = {
    spring_week: "Spring Week",
    summer_internship: "Summer Internship",
    graduate: "Graduate",
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>My Progress</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Track your CV and interview performance over time
        </p>
      </div>

      {/* Empty state */}
      {!hasAnything && (
        <div
          className="rounded-2xl border flex flex-col items-center justify-center py-24 gap-4 text-center"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          <span className="text-5xl">📈</span>
          <div>
            <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>No data yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
              Complete a CV analysis or mock interview to start tracking your progress
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <a
              href="/cv-optimizer"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "var(--color-brand-600)" }}
            >
              Analyse a CV
            </a>
            <a
              href="/interview-prep"
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", background: "var(--color-surface-2)" }}
            >
              Start Interview
            </a>
          </div>
        </div>
      )}

      {hasAnything && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="CVs Analysed" value={cvRecords.length.toString()} sub={avgCv !== null ? `Avg score ${avgCv}/100` : undefined} icon="📄" />
            <StatCard label="Interviews Done" value={ivRecords.length.toString()} sub={avgIv !== null ? `Avg score ${avgIv}/100` : undefined} icon="🎙️" />
            <StatCard
              label="Best CV Score"
              value={bestCv !== null ? `${bestCv}` : "—"}
              sub={bestCv !== null ? (bestCv >= 75 ? "Strong — interview ready" : bestCv >= 55 ? "Good — keep improving" : "Needs work") : undefined}
              icon="🏆"
            />
            <StatCard
              label="Best Interview Score"
              value={bestIv !== null ? `${bestIv}` : "—"}
              sub={bestIv !== null ? (bestIv >= 75 ? "Excellent performance" : bestIv >= 55 ? "Solid — refine answers" : "Keep practising") : undefined}
              icon="⭐"
            />
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CV trend */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>CV Score Trend</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>Overall score across all analyses</p>
                </div>
                {cvRecords.length >= 2 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: cvTrend[cvTrend.length - 1].score >= cvTrend[0].score ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)",
                      color: cvTrend[cvTrend.length - 1].score >= cvTrend[0].score ? "#4ade80" : "#f87171",
                    }}
                  >
                    {cvTrend[cvTrend.length - 1].score >= cvTrend[0].score ? "▲" : "▼"}{" "}
                    {Math.abs(cvTrend[cvTrend.length - 1].score - cvTrend[0].score)} pts
                  </span>
                )}
              </div>
              <Sparkline points={cvTrend} color="#6366f1" />
            </div>

            {/* Interview trend */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Interview Score Trend</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>Overall score across all mock interviews</p>
                </div>
                {ivRecords.length >= 2 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: ivTrend[ivTrend.length - 1].score >= ivTrend[0].score ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)",
                      color: ivTrend[ivTrend.length - 1].score >= ivTrend[0].score ? "#4ade80" : "#f87171",
                    }}
                  >
                    {ivTrend[ivTrend.length - 1].score >= ivTrend[0].score ? "▲" : "▼"}{" "}
                    {Math.abs(ivTrend[ivTrend.length - 1].score - ivTrend[0].score)} pts
                  </span>
                )}
              </div>
              <Sparkline points={ivTrend} color="#22c55e" />
            </div>
          </div>

          {/* CV history */}
          {cvRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
                CV Analysis History
              </h3>
              <div className="space-y-2">
                {cvRecords.map((r) => {
                  const open = expandedCv === r.id;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border overflow-hidden"
                      style={{ background: "var(--color-surface-1)", borderColor: open ? "var(--color-brand-500)" : "var(--color-border)", transition: "border-color .2s" }}
                    >
                      {/* Row */}
                      <button
                        onClick={() => setExpandedCv(open ? null : r.id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
                      >
                        {/* Score ring */}
                        <div
                          className="size-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: scoreBg(r.overallScore), color: scoreColor(r.overallScore) }}
                        >
                          {r.overallScore}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{r.fileName}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{fmt(r.date)}</p>
                        </div>

                        {/* Sub-score chips */}
                        <div className="hidden md:flex items-center gap-2">
                          {[
                            { l: "ATS", v: r.atsScore },
                            { l: "Content", v: r.contentScore },
                            { l: "Keywords", v: r.keywordScore },
                            { l: "Impact", v: r.impactScore },
                            { l: "Format", v: r.formatScore },
                          ].map(({ l, v }) => (
                            <span
                              key={l}
                              className="text-xs px-2 py-0.5 rounded-full tabular-nums"
                              style={{ background: scoreBg(v), color: scoreColor(v) }}
                            >
                              {l} {v}
                            </span>
                          ))}
                        </div>

                        {/* Chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 16 16" fill="none"
                          style={{ color: "var(--color-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {/* Expanded sub-scores */}
                      {open && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="h-px mb-4" style={{ background: "var(--color-border)" }} />
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <SubBar label="ATS Compatibility" value={r.atsScore} />
                            <SubBar label="Content Quality" value={r.contentScore} />
                            <SubBar label="Keyword Match" value={r.keywordScore} />
                            <SubBar label="Impact Statements" value={r.impactScore} />
                            <SubBar label="Format & Layout" value={r.formatScore} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interview history */}
          {ivRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
                Interview History
              </h3>
              <div className="space-y-2">
                {ivRecords.map((r) => {
                  const open = expandedIv === r.id;
                  const roleLabel = ROLE_LABELS[r.role] ?? r.role;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border overflow-hidden"
                      style={{ background: "var(--color-surface-1)", borderColor: open ? "var(--color-brand-500)" : "var(--color-border)", transition: "border-color .2s" }}
                    >
                      <button
                        onClick={() => setExpandedIv(open ? null : r.id)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
                      >
                        {/* Score ring */}
                        <div
                          className="size-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: scoreBg(r.overallScore), color: scoreColor(r.overallScore) }}
                        >
                          {r.overallScore}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                            {roleLabel}{r.firm ? ` — ${r.firm}` : ""}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{fmt(r.date)}</p>
                        </div>

                        {/* Sub-score chips */}
                        <div className="hidden md:flex items-center gap-2">
                          {[
                            { l: "Comms", v: r.communicationScore },
                            { l: "Commercial", v: r.commercialScore },
                            { l: "Motivation", v: r.motivationScore },
                            { l: "Competency", v: r.competencyScore },
                            { l: "Technical", v: r.technicalScore },
                          ].map(({ l, v }) => (
                            <span
                              key={l}
                              className="text-xs px-2 py-0.5 rounded-full tabular-nums"
                              style={{ background: scoreBg(v), color: scoreColor(v) }}
                            >
                              {l} {v}
                            </span>
                          ))}
                        </div>

                        {/* Chevron */}
                        <svg
                          width="14" height="14" viewBox="0 0 16 16" fill="none"
                          style={{ color: "var(--color-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {open && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="h-px mb-4" style={{ background: "var(--color-border)" }} />
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <SubBar label="Communication" value={r.communicationScore} />
                            <SubBar label="Commercial Aware." value={r.commercialScore} />
                            <SubBar label="Motivation & Fit" value={r.motivationScore} />
                            <SubBar label="Competency" value={r.competencyScore} />
                            <SubBar label="Technical" value={r.technicalScore} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
