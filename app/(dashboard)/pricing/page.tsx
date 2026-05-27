"use client";

import { useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Get started with the basics",
    popular: false,
    features: [
      "3 CV analyses per month",
      "3 mock interviews per month",
      "Basic scoring",
      "Generic question sets",
    ],
    cta: "Current plan",
    ctaDisabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "£19",
    period: "/month",
    description: "Everything you need to land the role",
    popular: true,
    features: [
      "Unlimited CV analyses",
      "Unlimited mock interviews",
      "Advanced AI feedback",
      "Role-specific question sets",
      "Job description matching",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    ctaDisabled: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "£49",
    period: "/month",
    description: "White-glove support for serious candidates",
    popular: false,
    features: [
      "Everything in Pro",
      "CV download with edits",
      "Custom interview personas",
      "Progress tracking",
      "1-on-1 coaching session (monthly)",
    ],
    cta: "Upgrade to Premium",
    ctaDisabled: false,
  },
];

const PERKS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    label: "Secure & private",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    label: "No commitment",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    label: "Cancel anytime",
  },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  function handleUpgrade(planName: string) {
    setSelectedPlan(planName);
    setModalOpen(true);
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div className="text-center mb-10">
        <h1
          className="text-3xl font-bold tracking-tight mb-3"
          style={{ color: "var(--color-foreground)" }}
        >
          Choose your plan
        </h1>
        <p className="text-base" style={{ color: "var(--color-muted)" }}>
          Invest in your finance career. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl p-6 flex flex-col relative"
            style={{
              background: plan.popular
                ? "var(--color-surface-2)"
                : "var(--color-surface-1)",
              border: `1.5px solid ${
                plan.popular
                  ? "var(--color-brand-500)"
                  : "var(--color-border)"
              }`,
              boxShadow: plan.popular
                ? "0 0 0 1px var(--color-brand-600), 0 8px 32px rgba(99,102,241,0.15)"
                : "none",
              transform: plan.popular ? "translateY(-6px)" : "none",
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "var(--color-brand-500)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                Most Popular
              </div>
            )}

            {/* Plan name + description */}
            <div className="mb-5">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: plan.popular ? "var(--color-brand-400)" : "var(--color-muted)" }}
              >
                {plan.name}
              </p>
              <div className="flex items-end gap-1 mb-1.5">
                <span
                  className="text-4xl font-bold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {plan.price}
                </span>
                <span
                  className="text-sm mb-1.5"
                  style={{ color: "var(--color-muted)" }}
                >
                  {plan.period}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {plan.description}
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: plan.popular ? "var(--color-brand-400)" : "var(--color-muted)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span style={{ color: "var(--color-foreground)" }}>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {plan.ctaDisabled ? (
              <button
                disabled
                className="w-full h-10 rounded-lg text-sm font-medium border transition-all"
                style={{
                  background: "transparent",
                  borderColor: "var(--color-border)",
                  color: "var(--color-muted)",
                  cursor: "default",
                  opacity: 0.6,
                }}
              >
                {plan.cta}
              </button>
            ) : plan.popular ? (
              <button
                onClick={() => handleUpgrade(plan.name)}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: "var(--color-brand-600)" }}
              >
                {plan.cta}
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.name)}
                className="w-full h-10 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
                  color: "#fff",
                }}
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* All plans include */}
      <div
        className="rounded-xl p-5 flex items-center justify-center gap-8 flex-wrap"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider w-full text-center mb-1"
          style={{ color: "var(--color-muted)" }}
        >
          All plans include
        </p>
        {PERKS.map((perk) => (
          <div
            key={perk.label}
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            <span style={{ color: "var(--color-brand-400)" }}>{perk.icon}</span>
            {perk.label}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="rounded-2xl p-8 max-w-sm w-full text-center"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="size-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(99,102,241,0.15)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--color-brand-400)">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              {selectedPlan} — Coming Soon
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-muted)" }}>
              Stripe integration coming soon — check back soon! We&apos;ll notify you when payments go live.
            </p>
            <button
              onClick={() => setModalOpen(false)}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--color-brand-600)" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
