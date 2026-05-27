"use client";

import { useState } from "react";
import CvUploadZone from "@/components/cv/upload-zone";
import CvAnalysisView from "@/components/cv/analysis-view";
import { saveCVRecord } from "@/lib/storage";

type View = "list" | "analyzing" | "result" | "error";

export default function CvOptimizerPage() {
  const [view, setView] = useState<View>("list");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [jobDescription, setJobDescription] = useState("");

  async function handleFileSelected(f: File) {
    setFile(f);
    setView("analyzing");
    setStep(0);
    setError(null);

    // Animate through stream steps while Claude works
    const steps = [0, 1, 2, 3, 4, 5, 6];
    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 600));
      setStep(s);
    }

    try {
      const formData = new FormData();
      formData.append("file", f);
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }

      const res = await fetch("/api/cv/analyse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setStep(8); // complete
      await new Promise((r) => setTimeout(r, 400));
      setAnalysis(data.analysis);
      saveCVRecord({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        fileName: f.name,
        overallScore: data.analysis.overallScore,
        atsScore: data.analysis.atsScore,
        contentScore: data.analysis.contentScore,
        keywordScore: data.analysis.keywordScore,
        impactScore: data.analysis.impactScore,
        formatScore: data.analysis.formatScore,
      });
      setView("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setView("error");
    }
  }

  if (view === "result" && analysis) {
    return (
      <CvAnalysisView
        fileName={file?.name ?? "CV.pdf"}
        file={file}
        analysis={analysis}
        onBack={() => { setView("list"); setAnalysis(null); }}
      />
    );
  }

  if (view === "analyzing") {
    return <AnalyzingView fileName={file?.name ?? "CV.pdf"} step={step} hasJd={!!jobDescription.trim()} />;
  }

  if (view === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)" }}>
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{error}</p>
        <button
          onClick={() => setView("list")}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-brand-600)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <CvListView
      onFileSelected={handleFileSelected}
      onCvClick={() => {}}
      jobDescription={jobDescription}
      onJobDescriptionChange={setJobDescription}
    />
  );
}

/* ─── List / Upload view ──────────────────────────────────────────────────── */
function CvListView({
  onFileSelected,
  onCvClick,
  jobDescription,
  onJobDescriptionChange,
}: {
  onFileSelected: (f: File) => void;
  onCvClick: () => void;
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
}) {
  const [jdOpen, setJdOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>Your CVs</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Upload a CV to get an AI-powered finance recruiting analysis
        </p>
      </div>

      <CvUploadZone onFileSelected={onFileSelected} />

      {/* Job Description panel */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--color-surface-1)", borderColor: jdOpen ? "var(--color-brand-500)" : "var(--color-border)", transition: "border-color 0.2s" }}
      >
        {/* Header / toggle */}
        <button
          onClick={() => setJdOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: jdOpen ? "rgba(99,102,241,.15)" : "var(--color-surface-2)", border: `1px solid ${jdOpen ? "rgba(99,102,241,.3)" : "var(--color-border)"}` }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="2" rx="1" fill={jdOpen ? "var(--color-brand-400)" : "var(--color-muted)"} />
                <rect x="2" y="6" width="8" height="2" rx="1" fill={jdOpen ? "var(--color-brand-400)" : "var(--color-muted)"} />
                <rect x="2" y="10" width="10" height="2" rx="1" fill={jdOpen ? "var(--color-brand-400)" : "var(--color-muted)"} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Add job description
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,.15)", color: "var(--color-brand-300)" }}
                >
                  Optional
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                {jobDescription.trim()
                  ? "✓ JD added — analysis will be targeted to this role"
                  : "Tailor the ATS scan and keyword analysis to a specific role"}
              </p>
            </div>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ color: "var(--color-muted)", transform: jdOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Expandable body */}
        {jdOpen && (
          <div className="px-4 pb-4 space-y-3">
            <div
              className="h-px w-full"
              style={{ background: "var(--color-border)" }}
            />
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Paste the full job description below. Claude will match your CV keywords against the exact requirements of this role.
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste the job description here…&#10;&#10;e.g. We are looking for a Summer Analyst to join our Investment Banking Division. The role involves financial modelling, pitchbook preparation, and client coverage across M&A and ECM transactions..."
              rows={8}
              className="w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-1"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                lineHeight: "1.6",
                // @ts-ignore
                "--tw-ring-color": "var(--color-brand-500)",
              }}
            />
            {jobDescription.trim() && (
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {jobDescription.trim().split(/\s+/).length} words · Claude will cross-reference every keyword
                </p>
                <button
                  onClick={() => onJobDescriptionChange("")}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--color-muted)" }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
      >
        <span className="text-lg mt-0.5">💡</span>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>
            Tips for best results
          </p>
          <ul className="text-xs space-y-1" style={{ color: "var(--color-muted)" }}>
            <li>• Upload a PDF for the most accurate text extraction</li>
            <li>• Add a job description for a role-specific ATS and keyword score</li>
            <li>• Analysis takes 15–30 seconds — Claude reads every bullet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Analyzing view ──────────────────────────────────────────────────────── */
const STREAM_STEPS = [
  "Parsing document structure...",
  "Extracting work experience and education...",
  "Identifying bullet points and action verbs...",
  "Running ATS compatibility check...",
  "Analysing keyword density against finance benchmarks...",
  "Scoring quantified impact statements...",
  "Generating finance-specific recommendations...",
  "Calculating sub-scores...",
  "Analysis complete ✓",
];

function AnalyzingView({ fileName, step, hasJd }: { fileName: string; step: number; hasJd: boolean }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
          Analysing your CV…
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
          Claude is reviewing{" "}
          <span style={{ color: "var(--color-brand-300)" }}>{fileName}</span>
          {hasJd ? " against your target role" : " against finance recruiting standards"}
        </p>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="size-2 rounded-full animate-pulse" style={{ background: "var(--color-brand-500)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-brand-300)" }}>
            AI Analysis in progress
          </span>
          {hasJd && (
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(99,102,241,.15)", color: "var(--color-brand-300)" }}
            >
              Role-targeted
            </span>
          )}
        </div>
        <div className="space-y-2 font-mono text-xs" style={{ color: "var(--color-muted)" }}>
          {STREAM_STEPS.slice(0, step + 1).map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ color: i < step ? "#4ade80" : "var(--color-brand-400)" }}>
                {i < step ? "✓" : "▶"}
              </span>
              <span style={{ color: i < step ? "var(--color-muted)" : "var(--color-foreground)" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {["ATS Score", "Content", "Keywords", "Impact"].map((label) => (
          <div
            key={label}
            className="rounded-xl h-20 animate-shimmer flex items-end p-3"
          >
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
