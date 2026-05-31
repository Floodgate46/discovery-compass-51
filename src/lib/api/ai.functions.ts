import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { DiscoveryData } from "../discovery-store";

async function callOpenRouter(messages: { role: string; content: string }[], maxTokens = 1200) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL ?? "openai/gpt-4o-mini";
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://discovery.getnoo.com",
      "X-Title": "Discovery Compass",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }
  const json = await res.json() as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

function buildDataSummary(data: DiscoveryData): string {
  return JSON.stringify({
    company: data.companyName,
    industry: data.industry,
    country: data.country,
    complianceCountry: data.complianceCountry,
    complianceRequirements: data.complianceRequirements,
    userRoles: data.userRoles,
    staffFeatures: data.staffFeatures,
    clientFeatures: data.clientFeatures,
    shiftTypes: data.shiftTypes,
    timeMethods: data.timeMethods,
    verificationMethods: data.verificationMethods,
    documentTypes: data.documentTypes,
    payrollSystem: data.payrollSystem,
    billingModel: data.billingModel,
    integrations: data.integrations,
    futureCapabilities: data.futureCapabilities,
    services: data.services,
    challenges: data.challenges,
  }, null, 2);
}

// Dynamic compliance requirements generation
export const generateComplianceRequirements = createServerFn({ method: "POST" })
  .inputValidator(z.object({ country: z.string(), industry: z.string() }))
  .handler(async ({ data }) => {
    const content = await callOpenRouter([
      {
        role: "system",
        content: `You are a healthcare compliance expert. Given a country and industry, return a JSON object with exactly these keys:
- standards: string[] (up to 6 applicable regulatory standards/frameworks)
- requirements: string (2-3 sentences summarising key compliance obligations)
- retention: string (record retention requirements, e.g. "7 years for care records under CQC")
Return ONLY valid JSON, no markdown.`,
      },
      { role: "user", content: `Country: ${data.country}\nIndustry: ${data.industry}` },
    ], 400);
    try {
      return JSON.parse(content) as { standards: string[]; requirements: string; retention: string };
    } catch {
      return { standards: [], requirements: content, retention: "" };
    }
  });

// AI field content suggestions for wizard free-text fields
export const suggestFieldContent = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    field: z.enum(["challenges", "services", "orgDescription"]),
    industry: z.string(),
    country: z.string(),
  }))
  .handler(async ({ data }) => {
    const prompts: Record<string, string> = {
      challenges: `List 3-4 specific business challenges typically faced by a ${data.industry} in ${data.country}. Be concrete and operational. 2-3 sentences of plain prose, no bullet points or markdown.`,
      services: `Describe the typical services provided by a ${data.industry} in ${data.country}. Be specific. 2-3 sentences of plain prose, no bullet points or markdown.`,
      orgDescription: `Write a concise organisational overview for a ${data.industry} in ${data.country}. 2-3 sentences of plain prose. No headings, no bullet points, no markdown formatting.`,
    };
    const suggestion = await callOpenRouter([
      { role: "system", content: "You are a healthcare business analyst. Write plain prose only — no markdown, no bullet points, no asterisks, no headings." },
      { role: "user", content: prompts[data.field] },
    ], 200);
    return { suggestion };
  });

// Analytics narrative for admin dashboard
export const generateAnalyticsNarrative = createServerFn({ method: "POST" })
  .inputValidator(z.object({ analytics: z.record(z.unknown()) }))
  .handler(async ({ data }) => {
    const narrative = await callOpenRouter([
      {
        role: "system",
        content: "You are a product analyst. Write a 2-3 sentence executive summary of discovery questionnaire submission trends. Be specific, actionable, and highlight the most important patterns.",
      },
      { role: "user", content: `Analytics data:\n${JSON.stringify(data.analytics, null, 2)}` },
    ], 300);
    return { narrative };
  });

// Sprint 7: Cross-section consistency check
export const checkConsistency = createServerFn({ method: "POST" })
  .inputValidator(z.object({ data: z.record(z.unknown()) }))
  .handler(async ({ data: { data } }) => {
    const summary = buildDataSummary(data as DiscoveryData);
    const content = await callOpenRouter([
      {
        role: "system",
        content: `You are a healthcare software requirements analyst. Review discovery questionnaire responses for contradictions, gaps, or inconsistencies. Return a JSON array of issues. Each issue: { severity: "warning"|"info", message: string }. Max 5 issues. Return ONLY valid JSON array, no markdown.`,
      },
      {
        role: "user",
        content: `Review these discovery responses:\n${summary}`,
      },
    ], 600);

    try {
      const issues = JSON.parse(content) as { severity: string; message: string }[];
      return { issues: Array.isArray(issues) ? issues : [] };
    } catch {
      return { issues: [] };
    }
  });

// Sprint 8: AI-enhanced BRD generation
export const generateAIBRD = createServerFn({ method: "POST" })
  .inputValidator(z.object({ data: z.record(z.unknown()) }))
  .handler(async ({ data: { data } }) => {
    const summary = buildDataSummary(data as DiscoveryData);
    const d = data as DiscoveryData;

    const content = await callOpenRouter([
      {
        role: "system",
        content: `You are a senior business analyst specialising in healthcare workforce management software. Generate a professional Business Requirements Document section. Be specific, actionable, and concise. Return plain text only — no asterisks, no markdown formatting, no bold/italic syntax. Use numbered sections and simple bullet points starting with a dash (-).`,
      },
      {
        role: "user",
        content: `Based on this discovery data for ${d.companyName || "the client"} (${d.industry}, ${d.country}), generate:

1. EXECUTIVE SUMMARY (2-3 sentences describing the business and core need)
2. PROBLEM STATEMENT (2-3 sentences on key pain points)
3. RISK ANALYSIS (3 bullet points: risk - mitigation)
4. PRIORITISED FEATURE RECOMMENDATIONS (top 5 features with one-line rationale each)
5. IMPLEMENTATION COMPLEXITY (Low/Medium/High with 1-sentence justification)

Discovery data:
${summary}

Format each section with its number and title on its own line, followed by the content.`,
      },
    ], 1200);

    return { content };
  });

// Sprint 9: Chat assistant
export const chatWithData = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    message: z.string().min(1).max(500),
    data: z.record(z.unknown()),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
  }))
  .handler(async ({ data: { message, data, history } }) => {
    const summary = buildDataSummary(data as DiscoveryData);
    const d = data as DiscoveryData;

    const reply = await callOpenRouter([
      {
        role: "system",
        content: `You are a helpful assistant reviewing a completed healthcare workforce management discovery questionnaire for ${d.companyName || "a client"} (${d.industry}, ${d.country}). Answer questions about their responses concisely. Here is their full discovery data:\n\n${summary}`,
      },
      ...history,
      { role: "user", content: message },
    ], 400);

    return { reply };
  });
