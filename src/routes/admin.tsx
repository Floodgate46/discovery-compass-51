import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getAdminSession, logoutAdmin } from "@/lib/api/auth.functions";
import { getSubmissions, getAnalytics, exportSubmissions } from "@/lib/api/admin.functions";
import { generateBRD } from "@/lib/pdf-generator";
import { generateAnalyticsNarrative } from "@/lib/api/ai.functions";

type Submission = { id: string; companyName: string | null; contactEmail: string | null; industry: string | null; country: string | null; submittedAt: Date; payload: unknown };

function toCSV(rows: Submission[]): string {
  const headers = ["ID", "Company", "Industry", "Country", "Email", "Submitted"];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((s) => [s.id, s.companyName, s.industry, s.country, s.contactEmail, new Date(s.submittedAt).toISOString()].map(escape).join(","));
  return [headers.join(","), ...body].join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
import type { DiscoveryData } from "@/lib/discovery-store";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Discovery Portal" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async ({ location }) => {
    if (location.pathname.startsWith("/admin/login")) return;
    const session = await getAdminSession();
    if (!session.userId) throw redirect({ to: "/admin/login" });
  },
  loader: async () => {
    const [{ submissions, total, pages }, analytics] = await Promise.all([
      getSubmissions({ data: { page: 1, search: "" } }),
      getAnalytics(),
    ]);
    return { submissions, total, pages, analytics };
  },
  component: AdminPage,
});

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#84cc16"];

function AdminPage() {
  const { submissions: initial, total, pages: totalPages, analytics } = Route.useLoaderData();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState(initial);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState(totalPages);
  const [tab, setTab] = useState<"submissions" | "analytics">("submissions");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      const { submissions: all } = await exportSubmissions();
      if (format === "csv") {
        downloadBlob(toCSV(all as Submission[]), "submissions.csv", "text/csv");
      } else {
        downloadBlob(JSON.stringify(all, null, 2), "submissions.json", "application/json");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleNarrative = async () => {
    setNarrativeLoading(true);
    try {
      const result = await generateAnalyticsNarrative({ data: { analytics } });
      setNarrative(result.narrative);
    } catch {
      setNarrative("Could not generate narrative. Please try again.");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const fetchPage = async (p: number, s: string) => {
    setLoading(true);
    const res = await getSubmissions({ data: { page: p, search: s } });
    setSubmissions(res.submissions);
    setPages(res.pages);
    setPage(p);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1, search);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs">G+</div>
          <span className="font-semibold text-sm">Admin Dashboard</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{total} submissions</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-lg border border-border bg-surface p-1 w-fit">
          {(["submissions", "analytics"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm capitalize transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "submissions" && (
          <>
            <div className="mb-4 flex gap-2 flex-wrap items-center justify-between">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company, industry, country, email…"
                  aria-label="Search submissions"
                  className="flex-1 rounded-lg border border-border bg-input px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>
              </form>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleExport("csv")} disabled={exporting} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/30 disabled:opacity-50">
                  {exporting ? "…" : "Export CSV"}
                </button>
                <button onClick={() => handleExport("json")} disabled={exporting} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-primary/30 disabled:opacity-50">
                  {exporting ? "…" : "Export JSON"}
                </button>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/60">
                    {["Company", "Industry", "Country", "Email", "Submitted", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={loading ? "opacity-50" : ""}>
                  {submissions.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-surface/40 transition">
                      <td className="px-4 py-3 font-medium">{s.companyName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.industry ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.country ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.contactEmail ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(s.submittedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => generateBRD(s.payload as unknown as DiscoveryData)}
                          className="text-xs text-primary hover:underline"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No submissions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button onClick={() => fetchPage(page - 1, search)} disabled={page === 1} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">← Prev</button>
                <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
                <button onClick={() => fetchPage(page + 1, search)} disabled={page === pages} className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}

        {tab === "analytics" && (
          <div className="space-y-8">
            <div className="glass-card rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2 mb-2">
                  <span className="text-primary">✦</span> AI Trend Summary
                </div>
                {narrativeLoading && <p className="text-sm text-muted-foreground">Generating summary…</p>}
                {!narrativeLoading && narrative && <p className="text-sm text-foreground/90 leading-relaxed">{narrative}</p>}
                {!narrativeLoading && !narrative && <p className="text-sm text-muted-foreground">Generate an AI-written summary of submission trends.</p>}
              </div>
              <button onClick={handleNarrative} disabled={narrativeLoading} className="shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-50">
                {narrativeLoading ? "Generating…" : narrative ? "Regenerate" : "Generate"}
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Total Submissions", value: analytics.total },
                { label: "Industries", value: analytics.byIndustry.length },
                { label: "Countries", value: analytics.byCountry.length },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-xl p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-3xl font-semibold">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-medium mb-4">Submissions by Industry</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.byIndustry} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-medium mb-4">Submissions by Country</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analytics.byCountry} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {analytics.byCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-medium mb-4">Top Requested Features</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.topFeatures} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="text-sm font-medium mb-4">Submissions Over Time</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.byMonth}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
