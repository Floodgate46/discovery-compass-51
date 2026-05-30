import { z } from "zod";
import type { DiscoveryData } from "./discovery-store";

// Per-section schemas for inline validation
export const sectionSchemas: Partial<Record<number, z.ZodObject<z.ZodRawShape>>> = {
  0: z.object({
    companyName: z.string().min(1, "Company name is required"),
    contactEmail: z.string().email("Enter a valid email").or(z.literal("")),
    industry: z.string().min(1, "Select an industry"),
    country: z.string().min(1, "Select a country"),
  }),
  1: z.object({
    userRoles: z.array(z.string()).min(1, "Select at least one role"),
  }),
  7: z.object({
    complianceCountry: z.string().min(1, "Select a compliance country"),
  }),
  10: z.object({
    payrollSystem: z.string().min(1, "Select a payroll system"),
    billingModel: z.string().min(1, "Select a billing model"),
  }),
};

export type ValidationErrors = Record<string, string>;

export function validateSection(step: number, data: Partial<DiscoveryData>): ValidationErrors {
  const schema = sectionSchemas[step];
  if (!schema) return {};
  const result = schema.safeParse(data);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.errors.map((e) => [e.path[0] as string, e.message])
  );
}
