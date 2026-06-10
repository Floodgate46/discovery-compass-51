import type { DiscoveryData } from "./discovery-store";
import { getServerEnv } from "./env.server";

const DEFAULT_SUBMISSION_RECIPIENTS = [
  "support@jetechltd.com.ng",
  "floodgatesautomation@gmail.com",
];

export function getSubmissionRecipients() {
  const fromEnv = getServerEnv("SUBMISSION_EMAIL_TO");
  const configured = fromEnv
    ? fromEnv.split(/[,;]+/).map((email) => email.trim()).filter(Boolean)
    : [];
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const email of [...configured, ...DEFAULT_SUBMISSION_RECIPIENTS]) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }
  return recipients;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function buildSubmissionText(data: DiscoveryData, submissionId: string) {
  const rows: Array<[string, unknown]> = [
    ["Reference", submissionId],
    ["Company", data.companyName],
    ["Contact email", data.contactEmail],
    ["Industry", data.industry],
    ["Country", data.country],
    ["Employees", data.employees],
    ["Clients", data.clients],
    ["Locations", data.locations],
    ["Current systems", data.currentSystems],
    ["Organization", data.orgDescription],
    ["Services", data.services],
    ["Challenges", data.challenges],
    ["User roles", data.userRoles],
    ["Role details", data.roleDetails],
    ["Staff features", data.staffFeatures],
    ["Client features", data.clientFeatures],
    ["Shift patterns", data.shiftTypes],
    ["Timesheet methods", data.timeMethods],
    ["Approval levels", data.approvalLevels],
    ["Compliance requirements", data.complianceRequirements],
    ["Verification methods", data.verificationMethods],
    ["Document types", data.documentTypes],
    ["Payroll system", data.payrollSystem],
    ["Billing model", data.billingModel],
    ["Reports required", data.reportsRequired],
    ["Notification channels", data.notificationMethods],
    ["Notification triggers", data.notificationTriggers],
    ["Integrations", data.integrations],
    ["Custom integrations", data.customIntegrations],
    ["Future capabilities", data.futureCapabilities],
  ];

  return rows.map(([label, value]) => `${label}: ${formatValue(value)}`).join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendResendEmail({
  subject,
  text,
  replyTo,
}: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const apiKey = getServerEnv("RESEND_API_KEY");
  const fromEmail = getServerEnv("RESEND_FROM_EMAIL") ?? "Discovery Portal <onboarding@resend.dev>";
  const to = getSubmissionRecipients();

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      reply_to: replyTo,
      subject,
      text,
      html: `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(text)}</pre>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${body}`);
  }

  return { sent: true, reason: "" };
}

export async function sendSubmissionEmail(data: DiscoveryData, submissionId: string) {
  const subject = `Discovery submission: ${data.companyName || "New prospect"}`;
  const text = buildSubmissionText(data, submissionId);
  return sendResendEmail({
    subject,
    text,
    replyTo: data.contactEmail || undefined,
  });
}

export interface NesreaReport {
  summary: string;
  gaps: string[];
  opportunities: string[];
}

function buildNesreaSubmissionText(
  department: string,
  departmentLabel: string,
  answers: Record<string, string>,
  report: NesreaReport,
  submissionId: string,
) {
  const answerLines = Object.entries(answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, value]) => `${id}: ${value || "-"}`)
    .join("\n");

  return [
    `Reference: ${submissionId}`,
    `Portal: NESREA ONE`,
    `Department code: ${department}`,
    `Department: ${departmentLabel}`,
    `Respondent: ${answers.A2 || "-"}`,
    `Position: ${answers.A3 || "-"}`,
    "",
    "Executive Summary:",
    report.summary,
    "",
    "Gaps / Missing Information:",
    ...(report.gaps.length ? report.gaps.map((g) => `- ${g}`) : ["- None noted"]),
    "",
    "Platform Opportunities:",
    ...(report.opportunities.length ? report.opportunities.map((o) => `- ${o}`) : ["- None noted"]),
    "",
    "Questionnaire Answers:",
    answerLines,
  ].join("\n");
}

export async function sendNesreaSubmissionEmail(
  department: string,
  departmentLabel: string,
  answers: Record<string, string>,
  report: NesreaReport,
  submissionId: string,
) {
  const subject = `NESREA ONE submission: ${departmentLabel} (${department})`;
  const text = buildNesreaSubmissionText(department, departmentLabel, answers, report, submissionId);
  return sendResendEmail({
    subject,
    text,
    replyTo: answers.A2?.includes("@") ? answers.A2 : undefined,
  });
}
