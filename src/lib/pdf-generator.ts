import jsPDF from "jspdf";
import type { DiscoveryData } from "./discovery-store";

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function stripMd(text: string): string {
  return text
    // markdown
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/`(.+?)`/g, "$1")
    // Unicode typography → ASCII (jsPDF Helvetica only covers Latin-1)
    .replace(/[‘’ʼ]/g, "'")   // smart single quotes / apostrophe
    .replace(/[“”]/g, '"')          // smart double quotes
    .replace(/—|―/g, " - ")         // em dash / horizontal bar
    .replace(/–/g, "-")                  // en dash
    .replace(/…/g, "...")                // ellipsis
    .replace(/ | | /g, " ")    // non-breaking / narrow spaces
    .replace(/•|‣|◦/g, "•")    // various bullet chars → latin bullet
    .replace(/−/g, "-")                  // minus sign
    .replace(/[‐‑]/g, "-")          // hyphens
    .replace(/[^\x00-\xFF]/g, "")            // drop anything outside Latin-1
    // whitespace
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

export async function generateBRD(data: DiscoveryData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const TW = W - M * 2;
  let y = M;

  const ensure = (need: number) => {
    if (y + need > H - M) { doc.addPage(); y = M; }
  };

  const h1 = (t: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 30, 50);
    doc.text(t, M, y);
    y += 28;
  };

  const h2 = (t: string) => {
    ensure(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(10, 110, 140);
    doc.text(t, M, y);
    y += 20;
  };

  // Render plain text, wrapping to fit TW. No maxWidth on pre-split lines.
  const p = (t: string) => {
    if (!t || t.trim() === "") return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 45, 60);
    const clean = stripMd(t);
    const lines: string[] = doc.splitTextToSize(clean, TW);
    for (const line of lines) {
      ensure(15);
      doc.text(line, M, y);
      y += 15;
    }
    y += 3;
  };

  const kv = (rows: Array<[string, string]>) => {
    const valW = TW - 150;
    for (const [k, v] of rows) {
      const val = stripMd(v || "—");
      const valLines: string[] = doc.splitTextToSize(val, valW);
      const rowH = Math.max(16, valLines.length * 14) + 4;
      ensure(rowH);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(70, 80, 100);
      doc.text(`${k}:`, M, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 35, 50);
      doc.text(valLines, M + 148, y);
      y += rowH;
    }
    y += 4;
  };

  // ── Cover page ─────────────────────────────────────────────────────────────
  doc.setFillColor(15, 30, 55);
  doc.rect(0, 0, W, 170, "F");

  const coverData = await loadImageAsDataUrl("/brd-cover.jpg");
  if (coverData) {
    try { doc.addImage(coverData, "JPEG", W - 210, 15, 170, 130); } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Business Requirements Document", M, 75);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Healthcare Workforce Management System", M, 100);
  doc.setFontSize(10);
  doc.text(`Prepared for: ${data.companyName || "Client"}`, M, 130);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), M, 148);
  y = 210;

  // ── 1. Organization Overview ───────────────────────────────────────────────
  h1("1. Organization Overview");
  kv([
    ["Company", data.companyName],
    ["Industry", data.industry],
    ["Country", data.country],
    ["Employees", data.employees],
    ["Clients", data.clients],
    ["Locations", data.locations],
    ["Current Systems", data.currentSystems],
  ]);
  h2("Description"); p(data.orgDescription);
  h2("Services"); p(data.services);
  h2("Challenges"); p(data.challenges);

  // ── 2. User Roles Matrix ───────────────────────────────────────────────────
  h1("2. User Roles Matrix");
  if (data.userRoles.length === 0) {
    p("No roles selected.");
  } else {
    for (const role of data.userRoles) {
      const d = data.roleDetails.find((r) => r.role === role);
      h2(role);
      kv([
        ["Can View", d?.canView ?? ""],
        ["Can Edit", d?.canEdit ?? ""],
        ["Approvals", d?.approvals ?? ""],
      ]);
    }
  }

  // ── 3. Functional Requirements ─────────────────────────────────────────────
  h1("3. Functional Requirements");
  h2("Staff Management");
  p(data.staffFeatures.join(", "));
  p(`Employee fields: ${data.employeeInfo}`);
  p(`Cert expiry tracking: ${data.certExpiryTracking ? "Yes" : "No"} • Auto renewal: ${data.autoRenewal ? "Yes" : "No"}`);

  h2("Client Management");
  p(`Manages clients: ${data.managesClients ? "Yes" : "No"}`);
  if (data.managesClients) {
    p(`Features: ${data.clientFeatures.join(", ")}`);
    p(data.clientInfo);
  }

  h2("Scheduling");
  p(`Shifts: ${data.hasShifts ? "Yes" : "No"}${data.hasShifts ? ` • Patterns: ${data.shiftTypes.join(", ")}` : ""}`);
  if (data.hasShifts) {
    p(`Assignment: ${data.shiftAssignment}`);
    p(`Swaps allowed: ${data.swapsAllowed ? "Yes" : "No"} • Approval required: ${data.swapApproval ? "Yes" : "No"}`);
  }

  h2("Timesheet Capture");
  p(`Methods: ${data.timeMethods.join(", ")}`);
  p(`Breaks: ${data.breaksTracked ? "Yes" : "No"} • Overtime calc: ${data.overtimeCalc ? "Yes" : "No"} • Missed clock-ins: ${data.missedClockIns ? "Yes" : "No"}`);
  p(`Overtime approval: ${data.overtimeApproval}`);

  h2("Approval Workflow");
  for (const lvl of data.approvalLevels) p(`Level ${lvl.level}: ${lvl.approver}`);
  p(`Delegation: ${data.delegationAllowed ? "Yes" : "No"} • Rejected editable: ${data.rejectedEditable ? "Yes" : "No"}`);

  h2("Attendance Verification");
  p(`Required: ${data.attendanceVerification ? "Yes" : "No"}${data.attendanceVerification ? ` • Methods: ${data.verificationMethods.join(", ")}` : ""}`);
  if (data.attendanceVerification) p(data.validationNotes);

  // ── 4. Compliance ──────────────────────────────────────────────────────────
  h1("4. Compliance");
  kv([["Country", data.complianceCountry]]);
  p(data.complianceRequirements);
  h2("Retention"); p(data.retentionRecords);

  // ── 5. Document Management ─────────────────────────────────────────────────
  h1("5. Document Management");
  p(`Types: ${data.documentTypes.join(", ")}`);
  kv([
    ["Storage", data.storageReq],
    ["Retention", data.retentionPeriod],
    ["Access", data.accessPermissions],
  ]);

  // ── 6. Payroll & Billing ───────────────────────────────────────────────────
  h1("6. Payroll & Billing");
  kv([["Payroll system", data.payrollSystem], ["Billing model", data.billingModel]]);
  p(`Weekend rates: ${data.weekendRates ? "Yes" : "No"} • Holiday: ${data.holidayRates ? "Yes" : "No"} • Overtime: ${data.overtimeRates ? "Yes" : "No"} • Travel: ${data.travelReimbursement ? "Yes" : "No"}`);

  // ── 7–10. Remaining sections ───────────────────────────────────────────────
  h1("7. Reports & Analytics");
  p(data.reportsRequired.join(", "));

  h1("8. Notifications");
  p(`Channels: ${data.notificationMethods.join(", ")}`);
  p(`Triggers: ${data.notificationTriggers.join(", ")}`);

  h1("9. Integrations");
  p(data.integrations.join(", "));
  p(data.customIntegrations);

  h1("10. Future Roadmap");
  p(data.futureCapabilities.join(", "));

  // ── 11. Non-Functional Requirements ───────────────────────────────────────
  h1("11. Non-Functional Requirements");
  p("Availability: 99.9% uptime SLA, multi-AZ deployment.");
  p("Security: TLS 1.3, encryption at rest, MFA, role-based access control.");
  p("Scalability: horizontal scaling for shift volume and concurrent clock-ins.");
  p("Accessibility: WCAG 2.1 AA across all surfaces.");
  p("Auditability: append-only audit log retained per compliance window.");

  // ── 12. Suggested Architecture ─────────────────────────────────────────────
  h1("12. Suggested System Architecture");
  p("Frontend: React + TypeScript SPA with PWA-capable mobile shell for field staff.");
  p("Backend: Node/TypeScript API on serverless edge runtime with Postgres primary store.");
  p("Auth: Row-level security; SSO bridges for Microsoft 365 / Google Workspace.");
  p("Realtime: WebSocket channel for live clock-in events and approval queues.");
  p("Storage: Object storage with signed URLs for care plans, medication logs, photo verification.");
  p("Integrations: Webhook gateway + queue for Xero, QuickBooks, Twilio, WhatsApp Business.");

  // ── 13. Recommended Tech Stack ─────────────────────────────────────────────
  h1("13. Recommended Tech Stack");
  kv([
    ["Frontend", "React 19, TypeScript, Tailwind, TanStack Router/Query"],
    ["Backend", "Supabase (Postgres, Auth, Storage, Edge Functions)"],
    ["Mobile", "PWA + React Native shell (phase 2)"],
    ["Payments/Billing", data.payrollSystem || "Xero or QuickBooks via API"],
    ["Comms", "Twilio (SMS), WhatsApp Business API, Resend (email)"],
    ["Observability", "Sentry + PostHog"],
  ]);

  // ── 14. Estimated Development Phases ──────────────────────────────────────
  h1("14. Estimated Development Phases");
  p("Phase 1 (4-6 wks): Auth, organisation, staff & client records, basic timesheet capture.");
  p("Phase 2 (4-6 wks): Shift scheduling, approval workflow, GPS verification, notifications.");
  p("Phase 3 (3-4 wks): Payroll integration, billing, reports, compliance exports.");
  p("Phase 4 (ongoing): AI scheduling, route optimisation, native mobile, family portal.");

  doc.save(`Discovery-BRD-${(data.companyName || "Client").replace(/\s+/g, "-")}.pdf`);
}
