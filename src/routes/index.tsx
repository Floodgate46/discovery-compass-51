import { createFileRoute, Link } from "@tanstack/react-router";
import { useDiscovery, SECTIONS } from "@/lib/discovery-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Healthcare Workforce Management Discovery Portal" },
      { name: "description", content: "Premium enterprise discovery workshop to gather business, operational, and compliance requirements before building your healthcare workforce platform." },
      { property: "og:title", content: "Healthcare Workforce Management Discovery Portal" },
      { property: "og:description", content: "Structured discovery wizard that produces a complete Business Requirements Document." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data, currentStep } = useDiscovery();
  const hasProgress = currentStep > 0 || Object.values(data).some(v => Array.isArray(v) ? v.length : typeof v === "boolean" ? v : Boolean(v && v !== ""));
  const completed = Math.round((currentStep / SECTIONS.length) * 100);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundOrbs />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="text-sm font-semibold tracking-tight">Getnoo</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Healthcare Solutions</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Discovery Portal · v1.0
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Enterprise discovery workshop
        </span>
        <h1 className="mt-6 text-balance text-5xl md:text-6xl font-semibold tracking-tight">
          Healthcare Workforce <span className="gradient-text">Management</span><br />Discovery Workshop
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base md:text-lg text-muted-foreground">
          Help us understand your business so we can design the right solution. Our 15-section wizard captures every requirement and generates a complete BRD ready for solution design.
        </p>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat icon="clock" label="Est. completion" value="20-30 min" />
          <Stat icon="save" label="Auto-save" value="Always on" />
          <Stat icon="doc" label="Output" value="BRD + PDF" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to="/wizard"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-[0.99]"
          >
            {hasProgress ? "Continue assessment" : "Start assessment"}
            <svg viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5"><path d="M3 8h10m0 0L9 4m4 4l-4 4" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" /></svg>
          </Link>
          {hasProgress && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${completed}%` }} />
              </div>
              <span>{completed}% complete · saved {data.lastSaved ? new Date(data.lastSaved).toLocaleString() : "just now"}</span>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-lg font-semibold">15 sections, end-to-end</h2>
          <span className="text-xs text-muted-foreground">From organization profile to future roadmap</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SECTIONS.map((s, i) => (
            <div key={s.id} className="glass-card rounded-xl p-4 transition hover:border-primary/30">
              <div className="text-[10px] font-mono text-primary">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-2 text-sm font-medium">{s.title}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Getnoo Healthcare Solutions</span>
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-success"><path d="M8 1l6 3v5c0 4-3 6-6 6s-6-2-6-6V4l6-3z" fill="currentColor" opacity="0.2" /><path d="M8 1l6 3v5c0 4-3 6-6 6s-6-2-6-6V4l6-3z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg>
            Secure. Reliable. Healthcare focused.
          </span>
        </div>
      </footer>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: "clock" | "save" | "doc"; label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-left">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon === "clock" && <svg viewBox="0 0 16 16" className="h-4 w-4"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>}
          {icon === "save" && <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 2h8l2 2v10H3V2z" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M5 2v4h6V2M5 14v-4h6v4" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>}
          {icon === "doc" && <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 1h7l3 3v11H3V1z" stroke="currentColor" strokeWidth="1.4" fill="none" /><path d="M5 7h6M5 10h6M5 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-sm font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm shadow-glow">
      G+
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
    </>
  );
}
