import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureDatabaseUrl } from "../env.server";

const stringArray = z.array(z.string());

const roleDetailSchema = z.object({
  role: z.string(),
  canView: z.string(),
  canEdit: z.string(),
  approvals: z.string(),
});

const approvalLevelSchema = z.object({
  level: z.number(),
  approver: z.string(),
});

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

export const submitDiscovery = createServerFn({ method: "POST" })
  .inputValidator(discoveryDataSchema)
  .handler(async ({ data }) => {
    const { sendSubmissionEmail } = await import("../email.server");

    let id = crypto.randomUUID();
    let submittedAt = new Date();
    let saved = false;
    let saveError = "";

    if (ensureDatabaseUrl()) {
      try {
        const { prisma } = await import("../prisma.server");
        const submission = await prisma.discoverySubmission.create({
          data: {
            companyName: data.companyName || null,
            contactEmail: data.contactEmail || null,
            industry: data.industry || null,
            country: data.country || null,
            payload: data,
          },
          select: {
            id: true,
            submittedAt: true,
          },
        });

        id = submission.id;
        submittedAt = submission.submittedAt;
        saved = true;
      } catch (error) {
        console.error(error);
        saveError = error instanceof Error ? error.message : "Database save failed";
      }
    } else {
      saveError = "Database is not configured";
    }

    let emailSent = false;
    let emailError = "";
    try {
      const email = await sendSubmissionEmail(data as unknown as import("../discovery-store").DiscoveryData, id);
      emailSent = email.sent;
      if (!email.sent) emailError = email.reason ?? "Email not sent";
    } catch (error) {
      console.error("Email send error:", error);
      emailError = error instanceof Error ? error.message : "Email failed";
    }

    if (!saved && !emailSent) {
      throw new Error(`Submission failed. ${saveError || "Database save failed"}. ${emailError || "Email failed"}.`);
    }

    return {
      id,
      submittedAt: submittedAt.toISOString(),
      saved,
      saveError,
      emailSent,
      emailError,
    };
  });
