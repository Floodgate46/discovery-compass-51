import { describe, it, expect } from "vitest";
import { z } from "zod";

// Inline the schema here so tests don't import server-only modules
const stringArray = z.array(z.string());
const roleDetailSchema = z.object({ role: z.string(), canView: z.string(), canEdit: z.string(), approvals: z.string() });
const approvalLevelSchema = z.object({ level: z.number(), approver: z.string() });

const discoveryDataSchema = z.object({
  companyName: z.string(),
  contactEmail: z.string().email().or(z.literal("")),
  industry: z.string(),
  country: z.string(),
  employees: z.string(),
  clients: z.string(),
  locations: z.string(),
  currentSystems: z.string(),
  orgDescription: z.string(),
  services: z.string(),
  challenges: z.string(),
  userRoles: stringArray,
  roleDetails: z.array(roleDetailSchema),
  staffFeatures: stringArray,
  employeeInfo: z.string(),
  certExpiryTracking: z.boolean(),
  autoRenewal: z.boolean(),
  managesClients: z.boolean(),
  clientFeatures: stringArray,
  clientInfo: z.string(),
  hasShifts: z.boolean(),
  shiftTypes: stringArray,
  shiftAssignment: z.string(),
  swapsAllowed: z.boolean(),
  swapApproval: z.boolean(),
  timeMethods: stringArray,
  breaksTracked: z.boolean(),
  overtimeCalc: z.boolean(),
  overtimeApproval: z.string(),
  missedClockIns: z.boolean(),
  approvalLevels: z.array(approvalLevelSchema),
  delegationAllowed: z.boolean(),
  rejectedEditable: z.boolean(),
  complianceCountry: z.string(),
  complianceRequirements: z.string(),
  retentionRecords: z.string(),
  attendanceVerification: z.boolean(),
  verificationMethods: stringArray,
  validationNotes: z.string(),
  documentTypes: stringArray,
  storageReq: z.string(),
  retentionPeriod: z.string(),
  accessPermissions: z.string(),
  payrollSystem: z.string(),
  billingModel: z.string(),
  weekendRates: z.boolean(),
  holidayRates: z.boolean(),
  overtimeRates: z.boolean(),
  travelReimbursement: z.boolean(),
  reportsRequired: stringArray,
  notificationMethods: stringArray,
  notificationTriggers: stringArray,
  integrations: stringArray,
  customIntegrations: z.string(),
  futureCapabilities: stringArray,
  lastSaved: z.string(),
});

const validPayload = {
  companyName: "Acme Care",
  contactEmail: "admin@acme.com",
  industry: "Home Care Agency",
  country: "United Kingdom",
  employees: "50",
  clients: "120",
  locations: "3",
  currentSystems: "Excel",
  orgDescription: "A home care agency",
  services: "Personal care",
  challenges: "Scheduling",
  userRoles: ["Administrators"],
  roleDetails: [{ role: "Administrators", canView: "all", canEdit: "all", approvals: "all" }],
  staffFeatures: ["Employee Records"],
  employeeInfo: "Name, DOB",
  certExpiryTracking: true,
  autoRenewal: false,
  managesClients: true,
  clientFeatures: ["Care Plans"],
  clientInfo: "Name, address",
  hasShifts: true,
  shiftTypes: ["Fixed shifts"],
  shiftAssignment: "Manual",
  swapsAllowed: false,
  swapApproval: false,
  timeMethods: ["Mobile App"],
  breaksTracked: true,
  overtimeCalc: false,
  overtimeApproval: "Manager",
  missedClockIns: false,
  approvalLevels: [{ level: 1, approver: "Supervisor" }],
  delegationAllowed: false,
  rejectedEditable: true,
  complianceCountry: "United Kingdom",
  complianceRequirements: "GDPR, CQC",
  retentionRecords: "7 years",
  attendanceVerification: true,
  verificationMethods: ["GPS Tracking"],
  validationNotes: "",
  documentTypes: ["Care Plans"],
  storageReq: "EU",
  retentionPeriod: "7 years",
  accessPermissions: "Role-based",
  payrollSystem: "Xero",
  billingModel: "Hourly",
  weekendRates: true,
  holidayRates: true,
  overtimeRates: false,
  travelReimbursement: false,
  reportsRequired: ["Attendance"],
  notificationMethods: ["Email"],
  notificationTriggers: ["Shift Reminder"],
  integrations: ["Xero"],
  customIntegrations: "",
  futureCapabilities: ["AI Scheduling"],
  lastSaved: new Date().toISOString(),
};

describe("discoveryDataSchema", () => {
  it("accepts a valid payload", () => {
    expect(() => discoveryDataSchema.parse(validPayload)).not.toThrow();
  });

  it("rejects an invalid email", () => {
    const result = discoveryDataSchema.safeParse({ ...validPayload, contactEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty contactEmail", () => {
    const result = discoveryDataSchema.safeParse({ ...validPayload, contactEmail: "" });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean certExpiryTracking", () => {
    const result = discoveryDataSchema.safeParse({ ...validPayload, certExpiryTracking: "yes" });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { companyName: _, ...rest } = validPayload;
    const result = discoveryDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts empty arrays for optional list fields", () => {
    const result = discoveryDataSchema.safeParse({ ...validPayload, userRoles: [], staffFeatures: [], integrations: [] });
    expect(result.success).toBe(true);
  });

  it("rejects non-number approval level", () => {
    const result = discoveryDataSchema.safeParse({
      ...validPayload,
      approvalLevels: [{ level: "one", approver: "Supervisor" }],
    });
    expect(result.success).toBe(false);
  });
});
