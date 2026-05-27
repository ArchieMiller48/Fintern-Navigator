"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CvUploadZone from "@/components/cv/upload-zone";

type RoleType = "spring_week" | "summer_internship" | "graduate";

const ROLES = [
  {
    id: "spring_week" as RoleType,
    label: "Spring Week",
    emoji: "🌱",
    desc: "Insight programme",
    focus: "Motivation · Commercial awareness · 1 competency",
  },
  {
    id: "summer_internship" as RoleType,
    label: "Summer Internship",
    emoji: "☀️",
    desc: "10-week programme",
    focus: "Motivation · Commercial · 2–3 competency",
  },
  {
    id: "graduate" as RoleType,
    label: "Graduate Role",
    emoji: "🎓",
    desc: "Full-time analyst",
    focus: "Full competency · Technical depth · Markets",
  },
];

const DURATIONS = [10, 20, 30];

export default function InterviewPrepPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleType>("summer_internship");
  const [duration, setDuration] = useState(20);
  const [firm, setFirm] = useState("");
  const [jdOpen, setJdOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const config = { role, duration, firm: firm.trim(), jd: jd.trim() };
    sessionStorage.setItem("interview_config", JSON.stringify(config));

    if (cvFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem("interview_cv_data", e.target?.result as string);
        sessionStorage.setItem("interview_cv_name", cvFile.name);
        router.push("/interview-prep/session");
      };
      reader.readAsDataURL(cvFile);
    } else {
      sessionStorage.removeItem("interview_cv_data");
      sessionStorage.removeItem("interview_cv_name");
      router.push("/interview-prep/session");
    }
  }

  return (
    <div className="space-y-6 animate-fade-up" style={{ maxWidth: 680 }}>
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
          Interview Prep
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Configure your mock interview — Claude will act as a real finance recruiter
        </p>
      </div>

      {/* Role type */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground)" }}>
          Role type
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className="p-4 rounded-xl border text-left transition-all"
              style={{
                background: role === r.id ? "rgba(99,102,241,.1)" : "var(--color-surface-1)",
                borderColor: role === r.id ? "var(--color-brand-500)" : "var(--color-border)",
              }}
            >
              <span className="text-2xl block mb-2">{r.emoji}</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                {r.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                {r.desc}
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--color-brand-300)" }}>
                {r.focus}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground)" }}>
          Duration
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="px-5 py-2 rounded-lg text-sm font-medium border transition-all"
              style={{
                background: duration === d ? "rgba(99,102,241,.1)" : "var(--color-surface-1)",
                borderColor: duration === d ? "var(--color-brand-500)" : "var(--color-border)",
                color: duration === d ? "var(--color-brand-300)" : "var(--color-muted)",
              }}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Firm & role */}
      <div>
        <p className="text-sm font-medium mb-1.5" style={{ color: "var(--color-foreground)" }}>
          Firm & division{" "}
          <span className="font-normal" style={{ color: "var(--color-muted)" }}>
            (optional)
          </span>
        </p>
        <input
          value={firm}
          onChange={(e) => setFirm(e.target.value)}
          placeholder="e.g. Goldman Sachs — Sales & Trading"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      {/* CV upload */}
      <div>
        <p className="text-sm font-medium mb-1.5" style={{ color: "var(--color-foreground)" }}>
          Your CV{" "}
          <span className="font-normal" style={{ color: "var(--color-muted)" }}>
            (optional — the interviewer will ask about your experience)
          </span>
        </p>
        {cvFile ? (
          <div
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {cvFile.name}
              </span>
            </div>
            <button
              onClick={() => setCvFile(null)}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "var(--color-muted)" }}
            >
              Remove
            </button>
          </div>
        ) : (
          <CvUploadZone onFileSelected={setCvFile} />
        )}
      </div>

      {/* Job description */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--color-surface-1)",
          borderColor: jdOpen ? "var(--color-brand-500)" : "var(--color-border)",
          transition: "border-color .2s",
        }}
      >
        <button
          onClick={() => setJdOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Add job description{" "}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                style={{ background: "rgba(99,102,241,.15)", color: "var(--color-brand-300)" }}
              >
                Optional
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {jd.trim()
                ? "✓ JD added — interviewer will ask role-specific questions"
                : "Helps the interviewer ask questions tailored to this exact role"}
            </p>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              color: "var(--color-muted)",
              transform: jdOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
              flexShrink: 0,
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {jdOpen && (
          <div className="px-4 pb-4 space-y-2">
            <div className="h-px" style={{ background: "var(--color-border)" }} />
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full rounded-lg p-3 text-sm resize-none outline-none"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                lineHeight: "1.6",
              }}
            />
          </div>
        )}
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
        style={{ background: loading ? "var(--color-surface-3)" : "var(--color-brand-600)", opacity: loading ? 0.8 : 1 }}
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Setting up interview…
          </>
        ) : (
          "Start Interview →"
        )}
      </button>

      {/* Tips */}
      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
      >
        <span className="text-lg mt-0.5">💡</span>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
            What to expect
          </p>
          <ul className="text-xs space-y-1" style={{ color: "var(--color-muted)" }}>
            <li>• Your webcam turns on to simulate a real video interview environment</li>
            <li>• The AI interviewer speaks aloud and listens to your responses</li>
            <li>• You receive a detailed scorecard with feedback after the session</li>
            <li>• Responses are scored against real finance recruiting criteria</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
