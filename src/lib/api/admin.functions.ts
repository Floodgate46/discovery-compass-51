import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSubmissions = createServerFn({ method: "GET" })
  .inputValidator(z.object({ page: z.number().default(1), search: z.string().default("") }))
  .handler(async ({ data }) => {
    const { prisma } = await import("../prisma.server");
    const PAGE_SIZE = 20;
    const skip = (data.page - 1) * PAGE_SIZE;
    const where = data.search
      ? {
          OR: [
            { companyName: { contains: data.search, mode: "insensitive" as const } },
            { industry: { contains: data.search, mode: "insensitive" as const } },
            { country: { contains: data.search, mode: "insensitive" as const } },
            { contactEmail: { contains: data.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [submissions, total] = await Promise.all([
      prisma.discoverySubmission.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          companyName: true,
          industry: true,
          country: true,
          contactEmail: true,
          submittedAt: true,
          payload: true,
        },
      }),
      prisma.discoverySubmission.count({ where }),
    ]);

    return { submissions, total, pages: Math.ceil(total / PAGE_SIZE) };
  });

export const exportSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("../prisma.server");
  const submissions = await prisma.discoverySubmission.findMany({
    orderBy: { submittedAt: "desc" },
    select: { id: true, companyName: true, contactEmail: true, industry: true, country: true, submittedAt: true, payload: true },
  });
  return { submissions };
});

export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { prisma } = await import("../prisma.server");

  const all = await prisma.discoverySubmission.findMany({
    select: { industry: true, country: true, payload: true, submittedAt: true },
  });

  const byIndustry: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const featureCounts: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const s of all) {
    if (s.industry) byIndustry[s.industry] = (byIndustry[s.industry] ?? 0) + 1;
    if (s.country) byCountry[s.country] = (byCountry[s.country] ?? 0) + 1;

    const month = s.submittedAt.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;

    const p = s.payload as Record<string, unknown>;
    const features = [
      ...((p.staffFeatures as string[]) ?? []),
      ...((p.clientFeatures as string[]) ?? []),
      ...((p.futureCapabilities as string[]) ?? []),
    ];
    for (const f of features) featureCounts[f] = (featureCounts[f] ?? 0) + 1;
  }

  const topFeatures = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    total: all.length,
    byIndustry: Object.entries(byIndustry).map(([name, count]) => ({ name, count })),
    byCountry: Object.entries(byCountry).map(([name, count]) => ({ name, count })),
    topFeatures,
    byMonth: Object.entries(byMonth)
      .sort()
      .map(([month, count]) => ({ month, count })),
  };
});
