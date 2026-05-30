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
        content: `You are a senior business analyst specialising in healthcare workforce management software. Generate a professional Business Requirements Document section. Be specific, actionable, and concise. Use plain text, no markdown headers.`,
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
