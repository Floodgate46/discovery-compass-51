import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function callOpenRouter(messages: { role: string; content: string }[], maxTokens = 600) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL ?? "openai/gpt-4o-mini";
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nesrea.lovable.app",
      "X-Title": "NESREA ONE Discovery",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const json = await res.json() as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

// AI-polish: clean up a (possibly voice-dictated) answer into clear prose
export const nesreaPolish = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    question: z.string(),
    raw: z.string().min(1).max(8000),
    department: z.string().optional().default(""),
  }))
  .handler(async ({ data }) => {
    const polished = await callOpenRouter([
      { role: "system", content: "You are an executive assistant helping a Nigerian federal-agency officer (NESREA) clean up dictated or quickly-typed answers. Preserve meaning and facts. Output clear, concise government-grade prose. No markdown. No headings. 1-4 short paragraphs maximum." },
      { role: "user", content: `Department: ${data.department || "Unspecified"}\nQuestion: ${data.question}\nRaw response:\n${data.raw}\n\nReturn ONLY the polished answer.` },
    ], 700);
    return { polished: polished.trim() };
  });

// AI-suggest: draft a starter answer for an officer who is stuck
export const nesreaSuggest = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    question: z.string(),
    department: z.string().optional().default(""),
    context: z.string().optional().default(""),
  }))
  .handler(async ({ data }) => {
    const suggestion = await callOpenRouter([
      { role: "system", content: "You are a Nigerian environmental-regulation analyst supporting NESREA officers completing a discovery questionnaire for the NESREA ONE digital platform. Draft a realistic starter answer the officer can edit. Be specific to Nigerian context. Plain prose, no markdown, 2-4 sentences." },
      { role: "user", content: `Department: ${data.department || "Unspecified"}\nQuestion: ${data.question}\nKnown context: ${data.context || "none"}\n\nReturn ONLY the draft answer.` },
    ], 400);
    return { suggestion: suggestion.trim() };
  });

// Submit: produces an executive summary + missing-info list for the whole questionnaire
export const nesreaSummarize = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    department: z.string(),
    answers: z.record(z.string()),
  }))
  .handler(async ({ data }) => {
    const summary = await callOpenRouter([
      { role: "system", content: "You are a senior consultant from Floodgate Digital / Jetech preparing an intake brief for NESREA ONE. Given a department's questionnaire answers, return a JSON object {summary: string, gaps: string[], opportunities: string[]}. summary = 5-7 sentence executive synthesis; gaps = up to 8 critical missing/weak answers; opportunities = up to 8 highest-impact platform interventions. JSON ONLY." },
      { role: "user", content: `Department: ${data.department}\nAnswers JSON:\n${JSON.stringify(data.answers).slice(0, 60000)}` },
    ], 1500);
    try {
      const cleaned = summary.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
      return JSON.parse(cleaned) as { summary: string; gaps: string[]; opportunities: string[] };
    } catch {
      return { summary: summary.slice(0, 1200), gaps: [], opportunities: [] };
    }
  });
