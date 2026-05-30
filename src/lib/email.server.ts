import type { DiscoveryData } from "./discovery-store";

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

export async function sendSubmissionEmail(data: DiscoveryData, submissionId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Discovery Portal <onboarding@resend.dev>";
  const toEmail = process.env.SUBMISSION_EMAIL_TO ?? "support@jetechltd.com.ng";

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const subject = `Discovery submission: ${data.companyName || "New prospect"}`;
  const text = buildSubmissionText(data, submissionId);
  const replyTo = data.contactEmail || undefined;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
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
