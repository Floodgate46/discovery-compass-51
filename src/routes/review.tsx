import { createFileRoute, Link } from "@tanstack/react-router";
import { useDiscovery, SECTIONS } from "@/lib/discovery-store";
import { generateBRD } from "@/lib/pdf-generator";
import { useState } from "react";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review · Discovery Portal" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const { data, reset } = useDiscovery();
  const [submitted, setSubmitted] = useState(false);

  const summaries: Array<[string, string | string[] | undefined]> = [
    ["Company", data.companyName],
    ["Industry", data.industry],
    ["Country", data.country],
    ["Workforce size", `${data.employees || "—"} employees · ${data.clients || "—"} clients · ${data.locations || "—"} locations`],
    ["User roles", data.userRoles],
    ["Staff features", data.staffFeatures],
    ["Client features", data.clientFeatures],
    ["Shift patterns", data.shiftTypes],
    ["Timesheet methods", data.timeMethods],
    ["Approval levels", data.approvalLevels.map(l => `L${l.level}: ${l.approver}`)],
    ["Verification", data.verificationMethods],
    ["Documents", data.documentTypes],
    ["Payroll system", data.payrollSystem],
    ["Billing model", data.billingModel],
    ["Reports", data.reportsRequired],
    ["Notification channels", data.notificationMethods],
    ["Integrations", data.integrations],
    ["Future roadmap", data.futureCapabilities],
  ];

  return (
    <main className="min-h-screen px-6 py-10 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/wizard" className="text-sm text-muted-foreground hover:text-foreground">← Back to wizard</Link>
          <span className="text-xs text-muted-foreground">Discovery complete</span>
        </div>

        <header className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            All 15 sections captured
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">Your <span className="gradient-text">discovery summary</span></h1>
          <p className="mt-3 text-muted-foreground">Review your answers, then download the full Business Requirements Document or submit for solution design.</p>
        </header>

        {/* Generated deliverables */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {["Business Requirements Document","User Roles Matrix","Workflow Diagram","Suggested Architecture"].map(t => (
            <div key={t} className="glass-card rounded-xl p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent mb-3">
                <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 1h7l3 3v11H3V1z" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M5 7h6M5 10h6M5 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </div>
              <div className="text-sm font-medium">{t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Auto-generated</div>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="glass-card rounded-2xl p-6 md:p-8 space-y-1 mb-10">
          {summaries.map(([label, val], i) => {
            const display = Array.isArray(val) ? (val.length ? val.join(", ") : "—") : (val || "—");
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 py-3 border-b border-border/60 last:border-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="text-sm text-foreground">{display}</div>
              </div>
            );
          })}
        </div>

        {/* Section completion */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-10">
          <div className="text-sm font-semibold mb-4">Sections covered</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-success/20 text-success">
                  <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                </span>
                <span className="truncate">{i + 1}. {s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => generateBRD(data)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M8 1v10m0 0l-4-4m4 4l4-4M2 15h12" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Download Discovery Report (PDF)
          </button>
          <button
            onClick={() => setSubmitted(true)}
            disabled={submitted}
            className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-6 py-3.5 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-60"
          >
            {submitted ? "Submitted ✓" : "Submit for Solution Design"}
          </button>
        </div>

        {submitted && (
          <div className="mt-6 mx-auto max-w-xl glass-card rounded-xl p-5 text-center">
            <div className="text-sm font-medium text-success">Thank you! Our solution architects will be in touch within 2 business days.</div>
            <button onClick={() => { reset(); setSubmitted(false); }} className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">Start a new discovery</button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
