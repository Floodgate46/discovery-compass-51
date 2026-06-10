import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNesrea } from "@/lib/nesrea-store";
import { GENERAL_SECTIONS, DEPARTMENTS, FINAL_SECTION, type NQ } from "@/lib/nesrea-questions";
import { useVoiceInput } from "@/components/nesrea/voice-input";
import { nesreaPolish, nesreaSuggest, nesreaSummarize } from "@/lib/api/nesrea.functions";

export const Route = createFileRoute("/nesrea")({
  head: () => ({ meta: [
    { title: "NESREA ONE — Digital Transformation Assessment" },
    { name: "description", content: "Confidential AI-assisted discovery questionnaire for the NESREA ONE platform." },
    { name: "robots", content: "noindex" },
  ]}),
  component: NesreaPortal,
});

function NesreaPortal() {
  const { department, setDepartment, answers, setAnswer, appendAnswer, lastSaved, reset } = useNesrea();
  const dept = useMemo(() => DEPARTMENTS.find((d) => d.code === department), [department]);

  const sections = useMemo(() => {
    if (!dept) return [];
    return [
      ...GENERAL_SECTIONS,
      { id: dept.code, title: `Department-Specific: ${dept.label}`, questions: dept.questions },
      FINAL_SECTION,
    ];
  }, [dept]);

  const [stepIdx, setStepIdx] = useState(0);
  const [report, setReport] = useState<{ summary: string; gaps: string[]; opportunities: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const summarize = useServerFn(nesreaSummarize);

  if (!dept) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <Header />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Select your department</h1>
        <p className="mt-2 text-sm text-muted-foreground">You have been nominated as your department's designated respondent. Choose your department to begin. Your answers can use text or voice input, and an AI assistant will help clean them up.</p>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {DEPARTMENTS.map((d) => (
            <button key={d.code} onClick={() => { setDepartment(d.code); setStepIdx(0); }} className="glass-card rounded-xl p-4 text-left transition hover:border-primary/40">
              <div className="text-[10px] font-mono text-primary">{d.code}</div>
              <div className="mt-1 font-medium">{d.label}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (report) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <Header />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Submission received</h1>
        <p className="mt-2 text-sm text-muted-foreground">Thank you. The intake below has been generated from your responses for the {dept.label} ({dept.code}).</p>

        <section className="glass-card rounded-xl p-5 mt-6">
          <h2 className="text-sm font-semibold text-primary">Executive Summary</h2>
          <p className="mt-2 text-sm whitespace-pre-line">{report.summary}</p>
        </section>
        <section className="glass-card rounded-xl p-5 mt-4">
          <h2 className="text-sm font-semibold text-primary">Gaps / Missing Information</h2>
          <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5">
            {report.gaps.map((g, i) => <li key={i}>{g}</li>)}
            {report.gaps.length === 0 && <li className="text-muted-foreground list-none">No critical gaps detected.</li>}
          </ul>
        </section>
        <section className="glass-card rounded-xl p-5 mt-4">
          <h2 className="text-sm font-semibold text-primary">Platform Opportunities</h2>
          <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5">
            {report.opportunities.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </section>

        <div className="mt-6 flex gap-3">
          <button onClick={() => setReport(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary/40">Back to answers</button>
          <button onClick={() => { reset(); setReport(null); setStepIdx(0); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start a new submission</button>
        </div>
      </main>
    );
  }

  const section = sections[stepIdx];
  const isLast = stepIdx === sections.length - 1;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await summarize({ data: { department: dept.code, answers } });
      setReport(result);
    } catch (e) {
      alert("Could not submit: " + (e instanceof Error ? e.message : "unknown error"));
    } finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface/40 backdrop-blur p-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Header compact />
        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Department</div>
          <div className="text-sm font-semibold">{dept.label}</div>
          <button onClick={() => { setDepartment(""); }} className="mt-1 text-[11px] text-muted-foreground hover:text-foreground underline">Change department</button>
        </div>
        <nav className="mt-6 space-y-1">
          {sections.map((s, i) => (
            <button key={s.id} onClick={() => setStepIdx(i)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${i === stepIdx ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
              <span className="text-[10px] font-mono w-8 text-primary">{s.id}</span>
              <span className="truncate">{s.title.replace(/^[A-Z]\.\s*/, "")}</span>
            </button>
          ))}
        </nav>
        {lastSaved && <div className="mt-6 text-[10px] text-muted-foreground">Auto-saved {new Date(lastSaved).toLocaleTimeString()}</div>}
      </aside>

      <section className="flex-1 px-6 py-8 lg:px-12 lg:py-12 max-w-3xl mx-auto w-full">
        <div className="text-xs text-muted-foreground font-mono">{section.id} · {stepIdx + 1} of {sections.length}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{section.title}</h2>
        {section.intro && <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>}

        <div className="mt-6 space-y-6">
          {section.questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              department={dept.code}
              value={answers[q.id] ?? ""}
              onChange={(v) => setAnswer(q.id, v)}
              onAppend={(v) => appendAnswer(q.id, v)}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button disabled={stepIdx === 0} onClick={() => setStepIdx(stepIdx - 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:border-primary/40">Back</button>
          {isLast ? (
            <button onClick={onSubmit} disabled={submitting} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit & generate brief"}
            </button>
          ) : (
            <button onClick={() => setStepIdx(stepIdx + 1)} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Continue</button>
          )}
        </div>
      </section>
    </main>
  );
}

function QuestionCard({ q, value, onChange, onAppend, department }: { q: NQ; value: string; onChange: (v: string) => void; onAppend: (v: string) => void; department: string }) {
  const [busy, setBusy] = useState<"polish" | "suggest" | null>(null);
  const polish = useServerFn(nesreaPolish);
  const suggest = useServerFn(nesreaSuggest);

  const { listening, interim, supported, toggle } = useVoiceInput((text) => onAppend(text));

  const runPolish = async () => {
    if (!value.trim()) return;
    setBusy("polish");
    try { const r = await polish({ data: { question: q.q, raw: value, department } }); onChange(r.polished); }
    catch (e) { alert("AI error: " + (e instanceof Error ? e.message : "")); }
    finally { setBusy(null); }
  };
  const runSuggest = async () => {
    setBusy("suggest");
    try { const r = await suggest({ data: { question: q.q, department, context: value } }); onChange((value ? value + "\n\n" : "") + r.suggestion); }
    catch (e) { alert("AI error: " + (e instanceof Error ? e.message : "")); }
    finally { setBusy(null); }
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <label className="block text-sm font-medium">
        <span className="text-[10px] font-mono text-primary mr-2">{q.id}</span>{q.q}
      </label>
      {q.hint && <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Type, dictate, or skip with N/A"
        className="mt-3 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {listening && interim && <div className="mt-1 text-[11px] italic text-muted-foreground">… {interim}</div>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {supported ? (
          <button onClick={toggle} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${listening ? "border-red-500/60 text-red-400 bg-red-500/10" : "border-border hover:border-primary/40"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${listening ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
            {listening ? "Stop voice" : "Voice"}
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground">Voice not supported in this browser</span>
        )}
        <button onClick={runSuggest} disabled={busy !== null} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary/40 disabled:opacity-50">
          {busy === "suggest" ? "Drafting…" : "AI suggest"}
        </button>
        <button onClick={runPolish} disabled={busy !== null || !value.trim()} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary/40 disabled:opacity-50">
          {busy === "polish" ? "Polishing…" : "AI polish"}
        </button>
        <button onClick={() => onChange("N/A")} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">Mark N/A</button>
      </div>
    </div>
  );
}

function Header({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold">N1</div>
      <div>
        <div className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>NESREA ONE</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Digital Transformation Assessment</div>
      </div>
    </div>
  );
}
