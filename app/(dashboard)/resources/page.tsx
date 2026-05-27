"use client";

import { useState, useMemo } from "react";

const RESOURCES = [
  /* ── Courses ──────────────────────────────────────────────────── */
  {
    id: 1,
    category: "Courses",
    title: "Goldman Sachs — Investment Banking Virtual Experience",
    description: "Forage programme covering financial modelling, pitchbook creation, and M&A analysis. One of the most recognised spring week simulators.",
    type: "Forage",
    meta: "Free · ~5–6 hrs",
    icon: "🏦",
    color: "#6366f1",
    url: "https://www.theforage.com/simulations/goldman-sachs/investment-banking-s5v5",
  },
  {
    id: 2,
    category: "Courses",
    title: "JPMorgan — Investment Banking Virtual Experience",
    description: "Hands-on tasks simulating real IB analyst work: merger modelling, pitch preparation, and client communication.",
    type: "Forage",
    meta: "Free · ~5 hrs",
    icon: "📊",
    color: "#6366f1",
    url: "https://www.theforage.com/simulations/jpmorgan/investment-banking-0h7a",
  },
  {
    id: 3,
    category: "Courses",
    title: "Blackstone — Private Equity Virtual Experience",
    description: "Learn deal sourcing, LBO analysis, and portfolio management through Blackstone's official Forage programme.",
    type: "Forage",
    meta: "Free · ~4 hrs",
    icon: "🔱",
    color: "#6366f1",
    url: "https://www.theforage.com/simulations/blackstone/private-equity-mfej",
  },
  {
    id: 4,
    category: "Courses",
    title: "Bank of America — Global Markets Virtual Experience",
    description: "Sales & trading focused tasks — market commentary, trade ideas, and risk assessment. Perfect for S&T applicants.",
    type: "Forage",
    meta: "Free · ~3–4 hrs",
    icon: "📈",
    color: "#6366f1",
    url: "https://www.theforage.com/simulations/bank-of-america/global-markets-td2v",
  },
  {
    id: 5,
    category: "Courses",
    title: "Morgan Stanley — Investment Management Virtual Experience",
    description: "Portfolio analysis, ESG integration, and client reporting tasks from Morgan Stanley's asset management division.",
    type: "Forage",
    meta: "Free · ~4 hrs",
    icon: "💼",
    color: "#6366f1",
    url: "https://www.theforage.com/simulations/morgan-stanley/investment-management-ob7r",
  },
  {
    id: 6,
    category: "Courses",
    title: "Browse All Finance Forage Programmes",
    description: "Filter by firm and division to find the right virtual experience — completing multiple programmes strengthens applications significantly.",
    type: "Forage",
    meta: "Free · Multiple",
    icon: "🎓",
    color: "#6366f1",
    url: "https://www.theforage.com/dashboard?programs=true&topic=finance",
  },

  /* ── Trackers ─────────────────────────────────────────────────── */
  {
    id: 7,
    category: "Trackers",
    title: "Bright Network — Finance Opportunities",
    description: "The UK's largest graduate network. Track live spring week, internship, and graduate openings from top finance firms.",
    type: "Tracker",
    meta: "Free · Updated daily",
    icon: "🔦",
    color: "#22c55e",
    url: "https://www.brightnetwork.co.uk/graduate-jobs/banking-finance/",
  },
  {
    id: 8,
    category: "Trackers",
    title: "Rate My Placement — Finance Internships",
    description: "Browse reviewed internship and placement listings with salary data, application deadlines, and student reviews.",
    type: "Tracker",
    meta: "Free · Reviews included",
    icon: "⭐",
    color: "#22c55e",
    url: "https://www.ratemyplacement.co.uk/search?q=finance",
  },
  {
    id: 9,
    category: "Trackers",
    title: "WikiJob — Finance Graduate Jobs",
    description: "Comprehensive UK finance application tracker with firm-specific tips, deadlines, and test prep for online assessments.",
    type: "Tracker",
    meta: "Free · Deadline alerts",
    icon: "📋",
    color: "#22c55e",
    url: "https://www.wikijob.co.uk/finance-section/investment-banking",
  },
  {
    id: 10,
    category: "Trackers",
    title: "TargetJobs — Investment Banking",
    description: "Structured listings of IB spring weeks, summer internships, and graduate roles with employer profiles and application advice.",
    type: "Tracker",
    meta: "Free · Employer profiles",
    icon: "🎯",
    color: "#22c55e",
    url: "https://targetjobs.co.uk/career-sectors/investment-banking",
  },
  {
    id: 11,
    category: "Trackers",
    title: "Wall Street Oasis — Job Board",
    description: "The most active finance community job board. Real deadline tracking, student experiences, and salary benchmarks by firm.",
    type: "Tracker",
    meta: "Free · Community verified",
    icon: "🌐",
    color: "#22c55e",
    url: "https://www.wallstreetoasis.com/finance-jobs",
  },

  /* ── Interview Prep ───────────────────────────────────────────── */
  {
    id: 12,
    category: "Interview Prep",
    title: "Mergers & Inquisitions — Interview Guides",
    description: "The most comprehensive free resource for IB interview prep. Covers fit, technical, and markets questions with model answers.",
    type: "Article",
    meta: "Free · Extensive",
    icon: "🎯",
    color: "#f59e0b",
    url: "https://mergersandinquisitions.com/investment-banking-interview-questions-and-answers/",
  },
  {
    id: 13,
    category: "Interview Prep",
    title: "Wall Street Oasis — IB Interview Guide",
    description: "Community-driven Q&A bank with thousands of real interview questions from verified finance professionals.",
    type: "Guide",
    meta: "Free · Community answers",
    icon: "💬",
    color: "#f59e0b",
    url: "https://www.wallstreetoasis.com/finance-interview-questions",
  },
  {
    id: 14,
    category: "Interview Prep",
    title: "WikiJob — Competency Interview Questions",
    description: "Finance-specific competency question bank with STAR-structured model answers for spring weeks and internships.",
    type: "Article",
    meta: "Free · STAR examples",
    icon: "⭐",
    color: "#f59e0b",
    url: "https://www.wikijob.co.uk/interview-advice/competency-based/competency-based-interview-questions",
  },

  /* ── Technical ────────────────────────────────────────────────── */
  {
    id: 15,
    category: "Technical",
    title: "Breaking Into Wall Street — Free Excel & Modelling",
    description: "Free financial modelling tutorials covering DCF, LBO, comps, and merger models used in real analyst roles.",
    type: "Tutorial",
    meta: "Free · Video + files",
    icon: "📊",
    color: "#ec4899",
    url: "https://breakingintowallstreet.com/biws/free-excel-vba-course/",
  },
  {
    id: 16,
    category: "Technical",
    title: "Investopedia — Financial Modelling Concepts",
    description: "Clear, jargon-free explanations of DCF, WACC, EV/EBITDA, and other core technical concepts tested in interviews.",
    type: "Article",
    meta: "Free · Searchable",
    icon: "📖",
    color: "#ec4899",
    url: "https://www.investopedia.com/financial-term-dictionary-4769738",
  },
  {
    id: 17,
    category: "Technical",
    title: "CFI — Introduction to Corporate Finance (Free)",
    description: "Corporate Finance Institute's free intro course. Covers financial statements, ratios, and valuation fundamentals.",
    type: "Course",
    meta: "Free · Certificate",
    icon: "🎓",
    color: "#ec4899",
    url: "https://corporatefinanceinstitute.com/courses/introduction-corporate-finance/",
  },

  /* ── Markets ──────────────────────────────────────────────────── */
  {
    id: 18,
    category: "Markets",
    title: "Financial Times — Markets Data",
    description: "Real-time equities, FX, rates, and commodities. Essential for staying current on market moves before interviews.",
    type: "News",
    meta: "Freemium · Live data",
    icon: "📰",
    color: "#8b5cf6",
    url: "https://markets.ft.com/data",
  },
  {
    id: 19,
    category: "Markets",
    title: "Bloomberg — Markets Overview",
    description: "Bloomberg's public markets hub. Indices, sector performance, and economic calendars — free without a terminal.",
    type: "News",
    meta: "Free · Live data",
    icon: "📡",
    color: "#8b5cf6",
    url: "https://www.bloomberg.com/markets",
  },
  {
    id: 20,
    category: "Markets",
    title: "The Economist — Finance & Economics",
    description: "Long-form analysis of macro trends, central bank policy, and global markets. Great for building commercial awareness.",
    type: "News",
    meta: "Freemium · Weekly",
    icon: "🌍",
    color: "#8b5cf6",
    url: "https://www.economist.com/finance-and-economics",
  },
];

const TABS = ["All", "Courses", "Trackers", "Interview Prep", "Technical", "Markets"] as const;
type Tab = (typeof TABS)[number];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      const matchesTab = activeTab === "All" || r.category === activeTab;
      const matchesSearch =
        !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
          Resources
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Curated links for finance career prep — courses, trackers, and reading
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: isActive ? "var(--color-foreground)" : "var(--color-muted)" }}
            >
              {tab}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: "var(--color-brand-500)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
        {filtered.length} {filtered.length === 1 ? "resource" : "resources"}
        {activeTab !== "All" && ` in ${activeTab}`}
        {search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
          style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
        >
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium text-sm mb-1" style={{ color: "var(--color-foreground)" }}>No resources found</p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}

type Resource = (typeof RESOURCES)[number];

function ResourceCard({ resource: r }: { resource: Resource }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-4 rounded-xl border p-5 transition-all no-underline"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-brand-500)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      {/* Icon + external arrow */}
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${r.color}22` }}
        >
          {r.icon}
        </div>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          style={{ color: "var(--color-muted)" }}
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 flex-1">
        <p className="font-semibold text-sm leading-snug" style={{ color: "var(--color-foreground)" }}>
          {r.title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {r.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: `${r.color}22`, color: r.color }}
        >
          {r.type}
        </span>
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>{r.meta}</span>
      </div>
    </a>
  );
}
