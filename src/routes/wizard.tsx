import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDiscovery, SECTIONS } from "@/lib/discovery-store";
import { SECTION_COMPONENTS } from "@/components/wizard/sections";
import { validateSection, type ValidationErrors } from "@/lib/validation";
import { WizardErrorBoundary } from "@/components/wizard/error-boundary";
import { useState, createContext, useContext } from "react";
import "@/lib/sentry";

export const ValidationContext = createContext<ValidationErrors>({});
export const useValidationErrors = () => useContext(ValidationContext);

export const Route = createFileRoute("/wizard")({
  head: () => ({ meta: [{ title: "Discovery Wizard · Getnoo" }, { name: "robots", content: "noindex" }] }),
  component: WizardPage,
});

function WizardPage() {
  const { currentStep, setStep, data } = useDiscovery();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const step = Math.min(currentStep, SECTIONS.length - 1);
  const Section = SECTION_COMPONENTS[step];
  const section = SECTIONS[step];
  const progress = ((step + 1) / SECTIONS.length) * 100;

  const next = () => {
    const errs = validateSection(step, data);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (step === SECTIONS.length - 1) navigate({ to: "/review" });
    else setStep(step + 1);
  };
  const prev = () => { setErrors({}); setStep(Math.max(0, step - 1)); };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface/40 backdrop-blur p-6 lg:p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">G+</div>
          <div>
            <div className="text-sm font-semibold">Discovery Portal</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Getnoo Healthcare</div>
          </div>
        </Link>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          {data.lastSaved && <div className="mt-2 text-[10px] text-muted-foreground">Auto-saved {new Date(data.lastSaved).toLocaleTimeString()}</div>}
        </div>

        <nav className="space-y-1">
          {SECTIONS.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${
                  active ? "bg-primary text-primary-foreground" : done ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 py-8 lg:px-12 lg:py-12 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono text-primary">{String(step + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}</span>
          <span>·</span>
          <span>{section.subtitle}</span>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8">
          <WizardErrorBoundary>
            <ValidationContext.Provider value={errors}>
              <Section />
            </ValidationContext.Provider>
          </WizardErrorBoundary>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M13 8H3m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" /></svg>
            Back
          </button>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Save & exit</Link>
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            {step === SECTIONS.length - 1 ? "Review & Generate" : "Continue"}
            <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 8h10m0 0L9 4m4 4l-4 4" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" /></svg>
          </button>
        </div>
      </main>
    </div>
  );
}
