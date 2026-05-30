import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Industry =
  | "Home Care Agency"
  | "Healthcare Staffing"
  | "Nursing Agency"
  | "Disability Support"
  | "Hospital"
  | "Community Care"
  | "Other";

export interface RoleDetail {
  role: string;
  canView: string;
  canEdit: string;
  approvals: string;
}

export interface ApprovalLevel {
  level: number;
  approver: string;
}

export interface DiscoveryData {
  // Section 1
  companyName: string;
  industry: Industry | "";
  country: string;
  employees: string;
  clients: string;
  locations: string;
  currentSystems: string;
  orgDescription: string;
  services: string;
  challenges: string;

  // Section 2
  userRoles: string[];
  roleDetails: RoleDetail[];

  // Section 3
  staffFeatures: string[];
  employeeInfo: string;
  certExpiryTracking: boolean;
  autoRenewal: boolean;

  // Section 4
  managesClients: boolean;
  clientFeatures: string[];
  clientInfo: string;

  // Section 5
  hasShifts: boolean;
  shiftTypes: string[];
  shiftAssignment: string;
  swapsAllowed: boolean;
  swapApproval: boolean;

  // Section 6
  timeMethods: string[];
  breaksTracked: boolean;
  overtimeCalc: boolean;
  overtimeApproval: string;
  missedClockIns: boolean;

  // Section 7
  approvalLevels: ApprovalLevel[];
  delegationAllowed: boolean;
  rejectedEditable: boolean;

  // Section 8
  complianceCountry: string;
  complianceRequirements: string;
  retentionRecords: string;

  // Section 9
  attendanceVerification: boolean;
  verificationMethods: string[];
  validationNotes: string;

  // Section 10
  documentTypes: string[];
  storageReq: string;
  retentionPeriod: string;
  accessPermissions: string;

  // Section 11
  payrollSystem: string;
  billingModel: string;
  weekendRates: boolean;
  holidayRates: boolean;
  overtimeRates: boolean;
  travelReimbursement: boolean;

  // Section 12
  reportsRequired: string[];

  // Section 13
  notificationMethods: string[];
  notificationTriggers: string[];

  // Section 14
  integrations: string[];
  customIntegrations: string;

  // Section 15
  futureCapabilities: string[];

  // Meta
  lastSaved: string;
}

const initialData: DiscoveryData = {
  companyName: "",
  industry: "",
  country: "",
  employees: "",
  clients: "",
  locations: "",
  currentSystems: "",
  orgDescription: "",
  services: "",
  challenges: "",
  userRoles: [],
  roleDetails: [],
  staffFeatures: [],
  employeeInfo: "",
  certExpiryTracking: false,
  autoRenewal: false,
  managesClients: false,
  clientFeatures: [],
  clientInfo: "",
  hasShifts: false,
  shiftTypes: [],
  shiftAssignment: "",
  swapsAllowed: false,
  swapApproval: false,
  timeMethods: [],
  breaksTracked: false,
  overtimeCalc: false,
  overtimeApproval: "",
  missedClockIns: false,
  approvalLevels: [
    { level: 1, approver: "Supervisor" },
    { level: 2, approver: "Operations Manager" },
    { level: 3, approver: "Payroll" },
  ],
  delegationAllowed: false,
  rejectedEditable: false,
  complianceCountry: "",
  complianceRequirements: "",
  retentionRecords: "",
  attendanceVerification: false,
  verificationMethods: [],
  validationNotes: "",
  documentTypes: [],
  storageReq: "",
  retentionPeriod: "",
  accessPermissions: "",
  payrollSystem: "",
  billingModel: "",
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

interface DiscoveryStore {
  data: DiscoveryData;
  currentStep: number;
  update: (patch: Partial<DiscoveryData>) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

export const useDiscovery = create<DiscoveryStore>()(
  persist(
    (set) => ({
      data: initialData,
      currentStep: 0,
      update: (patch) =>
        set((s) => ({
          data: { ...s.data, ...patch, lastSaved: new Date().toISOString() },
        })),
      setStep: (step) => set({ currentStep: step }),
      reset: () => set({ data: initialData, currentStep: 0 }),
    }),
    { name: "discovery-portal-v1" }
  )
);

export const SECTIONS = [
  { id: "org", title: "Organization", subtitle: "Tell us about your business" },
  { id: "roles", title: "Roles & Permissions", subtitle: "Who will use the system" },
  { id: "staff", title: "Staff Management", subtitle: "Workforce data needs" },
  { id: "clients", title: "Client Management", subtitle: "Patient & client records" },
  { id: "shifts", title: "Scheduling & Shifts", subtitle: "How work is planned" },
  { id: "timesheet", title: "Timesheet Capture", subtitle: "How time is recorded" },
  { id: "approval", title: "Approval Workflow", subtitle: "Sign-off process" },
  { id: "compliance", title: "Compliance", subtitle: "Regulations & retention" },
  { id: "gps", title: "Attendance Verification", subtitle: "Proof of presence" },
  { id: "documents", title: "Document Management", subtitle: "Files & retention" },
  { id: "payroll", title: "Payroll & Billing", subtitle: "Financial workflows" },
  { id: "reports", title: "Reports & Analytics", subtitle: "Insight requirements" },
  { id: "notifications", title: "Notifications", subtitle: "Communication channels" },
  { id: "integrations", title: "Integrations", subtitle: "Connected systems" },
  { id: "roadmap", title: "Future Roadmap", subtitle: "Vision & innovation" },
] as const;
