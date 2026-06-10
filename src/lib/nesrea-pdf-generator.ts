import jsPDF from "jspdf";
import { DEPARTMENTS, FINAL_SECTION, GENERAL_SECTIONS, type NSection } from "./nesrea-questions";

interface NesreaReport {
  summary: string;
  gaps: string[];
  opportunities: string[];
}

function stripMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/`(.+?)`/g, "$1")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/—|―/g, " - ")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .replace(/ | | /g, " ")
    .replace(/•|‣|◦/g, "•")
    .replace(/−/g, "-")
    .replace(/[‐‑]/g, "-")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function getSections(departmentCode: string): NSection[] {
  const dept = DEPARTMENTS.find((d) => d.code === departmentCode);
  if (!dept) return [...GENERAL_SECTIONS, FINAL_SECTION];
  return [
    ...GENERAL_SECTIONS,
    { id: dept.code, title: `Department-Specific: ${dept.label}`, questions: dept.questions },
    FINAL_SECTION,
  ];
}

export async function generateNesreaBrief(
  department: string,
  departmentLabel: string,
  answers: Record<string, string>,
  report: NesreaReport,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const TW = W - M * 2;
  let y = M;

  const ensure = (need: number) => {
    if (y + need > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const h1 = (t: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 30, 50);
    doc.text(t, M, y);
    y += 26;
  };

  const h2 = (t: string) => {
    ensure(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(10, 110, 140);
    doc.text(t, M, y);
    y += 18;
  };

  const p = (t: string) => {
    if (!t || t.trim() === "") return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 45, 60);
    const lines: string[] = doc.splitTextToSize(stripMd(t), TW);
    for (const line of lines) {
      ensure(15);
      doc.text(line, M, y);
      y += 15;
    }
    y += 3;
  };

  const bullets = (items: string[]) => {
    if (!items.length) {
      p("None noted.");
      return;
    }
    for (const item of items) p(`• ${item}`);
  };

  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, W, 150, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NESREA ONE Intake Brief", M, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Digital Transformation Assessment", M, 82);
  doc.setFontSize(10);
  doc.text(`Department: ${departmentLabel} (${department})`, M, 108);
  doc.text(`Respondent: ${answers.A2 || "—"}`, M, 124);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), M, 140);
  y = 175;

  h1("Executive Summary");
  p(report.summary);

  h1("Gaps / Missing Information");
  bullets(report.gaps);

  h1("Platform Opportunities");
  bullets(report.opportunities);

  for (const section of getSections(department)) {
    h1(section.title);
    if (section.intro) p(section.intro);
    for (const q of section.questions) {
      h2(`${q.id}. ${q.q}`);
      if (q.hint) p(q.hint);
      p(answers[q.id] || "—");
    }
  }

  const slug = departmentLabel.replace(/\s+/g, "-");
  doc.save(`NESREA-ONE-${slug}.pdf`);
}
