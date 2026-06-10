import { createFileRoute, Link } from "@tanstack/react-router";
import { useDiscovery, SECTIONS } from "@/lib/discovery-store";
import { submitDiscovery } from "@/lib/api/discovery.functions";
import { generateBRD } from "@/lib/pdf-generator";
import { checkConsistency, generateAIBRD, chatWithData } from "@/lib/api/ai.functions";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review · Discovery Portal" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

function ReviewPage() {
  const { data, reset } = useDiscovery();
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sprint 7: consistency check
  const [issues, setIssues] = useState<{ severity: string; message: string }[] | null>(null);
  const [checkingConsistency, setCheckingConsistency] = useState(false);

  // Sprint 8: AI BRD
  const [aiBRD, setAiBRD] = useState("");
  const [generatingBRD, setGeneratingBRD] = useState(false);
  const [showAiBRD, setShowAiBRD] = useState(false);

  // Sprint 9: chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatOpen]);

  // Auto-run consistency check on mount
  useEffect(() => {
    setCheckingConsistency(true);
    checkConsistency({ data: { data: data as unknown as Record<string, unknown> } })
      .then((r) => setIssues(r.issues))
      .catch(() => setIssues([]))
      .finally(() => setCheckingConsistency(false));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitDiscovery({ data });
      setSubmissionId(result.id);
      setEmailSent(result.emailSent);
      setEmailError(result.emailError ?? "");
      setSaved(result.saved);
      setSaveError(result.saveError ?? "");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not submit your discovery. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiBRD = async () => {
    setGeneratingBRD(true);
    setShowAiBRD(true);
    try {
      const result = await generateAIBRD({ data: { data: data as unknown as Record<string, unknown> } });
      setAiBRD(result.content);
    } catch {
      setAiBRD("Failed to generate analysis. Please try again.");
    } finally {
      setGeneratingBRD(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const result = await chatWithData({
        data: {
          message: chatInput,
          data: data as unknown as Record<string, unknown>,
          history: chatHistory,
        },
      });
      setChatHistory([...newHistory, { role: "assistant", content: result.reply }]);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const summaries: Array<[string, string | string[] | undefined]> = [
    ["Company", data.companyName],
    ["Contact email", data.contactEmail],
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

        {/* Sprint 7: Consistency check */}
        {checkingConsistency && (
          <div className="mb-6 glass-card rounded-xl p-4 flex items-center gap-3 text-sm text-muted-foreground">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" /></svg>
            Reviewing your responses for consistency…
          </div>
        )}
        {!checkingConsistency && issues && issues.length > 0 && (
          <div className="mb-6 glass-card rounded-xl p-5 space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-amber-400" fill="currentColor"><path d="M8 1L1 14h14L8 1zm0 3l4.5 8h-9L8 4zm0 3v2m0 2v1" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" /></svg>
              Consistency Review
            </div>
            {issues.map((issue, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ${issue.severity === "warning" ? "border border-amber-500/30 bg-amber-500/10 text-amber-200" : "border border-border bg-surface text-muted-foreground"}`}>
                <span className="mt-0.5 shrink-0">{issue.severity === "warning" ? "⚠" : "ℹ"}</span>
                {issue.message}
              </div>
            ))}
          </div>
        )}
        {!checkingConsistency && issues && issues.length === 0 && (
          <div className="mb-6 glass-card rounded-xl p-4 flex items-center gap-2 text-sm text-success">
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            Consistency check passed — no issues found.
          </div>
        )}

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

        {/* Sprint 8: AI BRD panel */}
        {showAiBRD && (
          <div className="glass-card rounded-2xl p-6 md:p-8 mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="text-primary">✦</span> Smart Analysis
              </div>
              <button onClick={() => setShowAiBRD(false)} className="text-xs text-muted-foreground hover:text-foreground">Hide</button>
            </div>
            {generatingBRD ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" /></svg>
                Generating analysis…
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">{aiBRD}</pre>
            )}
          </div>
        )}

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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => void generateBRD(data)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M8 1v10m0 0l-4-4m4 4l4-4M2 15h12" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Download BRD (PDF)
          </button>
          <button
            onClick={handleAiBRD}
            disabled={generatingBRD}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-60"
          >
            <span>✦</span>
            {generatingBRD ? "Generating…" : "Smart Analysis"}
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M2 2h12v9H9l-3 3v-3H2V2z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" /></svg>
            Ask anything
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitted || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-6 py-3.5 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-60"
          >
            {submitted ? "Submitted ✓" : isSubmitting ? "Submitting…" : "Submit for Solution Design"}
          </button>
        </div>

        {submitError && (
          <div className="mt-6 mx-auto max-w-xl rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
            {submitError}
          </div>
        )}

        {submitted && (
          <div className="mt-6 mx-auto max-w-xl glass-card rounded-xl p-5 text-center">
            <div className="text-sm font-medium text-success">
              {emailSent
                ? `Thank you! Your discovery was emailed to support@jetechltd.com.ng${saved ? " and saved" : ""}.`
                : `Thank you! Your discovery was received for solution design.${saved ? " (Saved to database.)" : ""}`}
            {!emailSent && emailError && (
              <div className="mt-1 text-xs text-amber-400">Email note: {emailError}</div>
            )}
            {!saved && saveError && (
              <div className="mt-1 text-xs text-amber-400">Dashboard note: {saveError}</div>
            )}
            </div>
            {submissionId && <div className="mt-2 text-xs text-muted-foreground">Reference: {submissionId}</div>}
            <button onClick={() => { reset(); setSubmitted(false); setSubmissionId(""); setEmailSent(false); setEmailError(""); setSaved(false); setSaveError(""); }} className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">Start a new discovery</button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </div>
      </div>

      {/* Sprint 9: Chat drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative z-10 w-full sm:w-96 h-[520px] glass-card rounded-2xl flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="text-primary">✦</span> Ask about your responses
              </div>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-xs text-muted-foreground text-center pt-4 space-y-2">
                  <p>Ask anything about your responses.</p>
                  <div className="flex flex-col gap-1.5">
                    {["What did I say about compliance?", "Summarise my staffing needs", "What integrations did I select?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} className="rounded-lg border border-border bg-input px-3 py-1.5 text-xs hover:border-primary/30 text-left">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" /></svg>
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChat} className="p-3 border-t border-border flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
                <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 8h10m0 0L9 4m4 4l-4 4" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
