import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">FN</span>
            </div>
            <span className="font-semibold text-white text-lg">Fintern Navigator</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium text-white leading-relaxed">
              &ldquo;Fintern Navigator helped me land my Goldman IB offer. The mock interviews
              felt like the real thing.&rdquo;
            </p>
            <footer className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-brand-300 font-semibold text-sm">
                JT
              </div>
              <div>
                <p className="text-white font-medium text-sm">James T.</p>
                <p className="text-brand-300 text-xs">IB Analyst, Goldman Sachs</p>
              </div>
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Avg CV Score Boost", value: "+31pts" },
            { label: "Mock Interviews", value: "50K+" },
            { label: "Offer Rate Increase", value: "3.2×" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-brand-300 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8" style={{ background: "var(--color-background)" }}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">FN</span>
              </div>
              <span className="font-semibold text-lg">Fintern Navigator</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
