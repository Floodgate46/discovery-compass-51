import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { DiscoveryData } from "../discovery-store";

const mockDoc = {
  internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
  setFillColor: vi.fn().mockReturnThis(),
  rect: vi.fn().mockReturnThis(),
  setTextColor: vi.fn().mockReturnThis(),
  setFont: vi.fn().mockReturnThis(),
  setFontSize: vi.fn().mockReturnThis(),
  text: vi.fn().mockReturnThis(),
  splitTextToSize: vi.fn((t: string) => [t]),
  addPage: vi.fn().mockReturnThis(),
  save: vi.fn(),
};

vi.mock("jspdf", () => ({
  default: vi.fn(function () {
    return mockDoc;
  }),
}));

const baseData: DiscoveryData = {
  companyName: "Test Co",
  contactEmail: "test@test.com",
  industry: "Home Care Agency",
  country: "United Kingdom",
  employees: "10",
  clients: "20",
  locations: "1",
  currentSystems: "Excel",
  orgDescription: "Test org",
  services: "Care",
  challenges: "Scheduling",
  userRoles: ["Administrators"],
  roleDetails: [{ role: "Administrators", canView: "all", canEdit: "all", approvals: "all" }],
  staffFeatures: ["Employee Records"],
  employeeInfo: "Name",
  certExpiryTracking: true,
  autoRenewal: false,
  managesClients: true,
  clientFeatures: ["Care Plans"],
  clientInfo: "Name",
  hasShifts: true,
  shiftTypes: ["Fixed shifts"],
  shiftAssignment: "Manual",
  swapsAllowed: false,
  swapApproval: false,
  timeMethods: ["Mobile App"],
  breaksTracked: false,
  overtimeCalc: false,
  overtimeApproval: "",
  missedClockIns: false,
  approvalLevels: [{ level: 1, approver: "Supervisor" }],
  delegationAllowed: false,
  rejectedEditable: false,
  complianceCountry: "United Kingdom",
  complianceRequirements: "GDPR",
  retentionRecords: "7 years",
  attendanceVerification: false,
  verificationMethods: [],
  validationNotes: "",
  documentTypes: [],
  storageReq: "",
  retentionPeriod: "",
  accessPermissions: "",
  payrollSystem: "Xero",
  billingModel: "Hourly",
  weekendRates: false,
  holidayRates: false,
  overtimeRates: false,
  travelReimbursement: false,
  reportsRequired: [],
  notificationMethods: [],
  notificationTriggers: [],
  integrations: [],
  customIntegrations: "",
  futureCapabilities: [],
  lastSaved: "",
};

let generateBRD: (data: DiscoveryData) => void;

beforeAll(async () => {
  const mod = await import("../pdf-generator");
  generateBRD = mod.generateBRD;
});

describe("generateBRD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls doc.save with the company name in the filename", () => {
    generateBRD(baseData);
    expect(mockDoc.save).toHaveBeenCalledWith(expect.stringContaining("Test-Co"));
  });

  it("calls doc.save once", () => {
    generateBRD(baseData);
    expect(mockDoc.save).toHaveBeenCalledTimes(1);
  });

  it("uses 'Client' as fallback when companyName is empty", () => {
    generateBRD({ ...baseData, companyName: "" });
    expect(mockDoc.save).toHaveBeenCalledWith(expect.stringContaining("Client"));
  });

  it("renders role details for each selected role", () => {
    generateBRD(baseData);
    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === "string" && t.includes("Administrators"))).toBe(true);
  });

  it("does not throw with all-empty optional fields", () => {
    expect(() =>
      generateBRD({
        ...baseData,
        userRoles: [],
        roleDetails: [],
        staffFeatures: [],
        shiftTypes: [],
        timeMethods: [],
        approvalLevels: [],
        verificationMethods: [],
        documentTypes: [],
        reportsRequired: [],
        notificationMethods: [],
        notificationTriggers: [],
        integrations: [],
        futureCapabilities: [],
      })
    ).not.toThrow();
  });
});
