import { useState } from "react";
import { useDiscovery } from "@/lib/discovery-store";
import { Field, TextInput, TextArea, Select, MultiSelect, Toggle, SectionHeader } from "./fields";
import { useValidationErrors } from "@/routes/wizard";
import { suggestFieldContent, generateComplianceRequirements } from "@/lib/api/ai.functions";

const ROLES = [
  "Administrators", "Supervisors", "Caregivers", "Nurses",
  "Support Workers", "Clients", "Family Members", "Payroll Officers", "Finance Team",
];

const COUNTRIES = ["United Kingdom", "United States", "Canada", "Australia", "New Zealand", "Ireland", "Other"];

const COMPLIANCE_MAP: Record<string, string[]> = {
  "United Kingdom": ["GDPR", "CQC", "DBS Checks"],
  "United States": ["HIPAA", "OSHA"],
  Canada: ["PIPEDA"],
  Australia: ["NDIS", "Privacy Act"],
};

export function S1Organization() {
  const { data, update } = useDiscovery();
  const errors = useValidationErrors();
  const [suggesting, setSuggesting] = useState<string | null>(null);

  const suggest = async (field: "challenges" | "services" | "orgDescription") => {
    if (!data.industry || !data.country) return;
    setSuggesting(field);
    try {
      const result = await suggestFieldContent({ data: { field, industry: data.industry, country: data.country } });
      update({ [field]: result.suggestion } as never);
    } catch { /* silent */ } finally {
      setSuggesting(null);
    }
  };

  const canSuggest = !!(data.industry && data.country);

  return (
    <div className="space-y-6">
      <SectionHeader title="Organization Information" subtitle="A snapshot of your business so we can scope the right solution." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Company Name" error={errors.companyName}><TextInput value={data.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Acme Healthcare" /></Field>
        <Field label="Contact Email" error={errors.contactEmail}><TextInput type="email" value={data.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} placeholder="name@company.com" /></Field>
        <Field label="Industry Type" error={errors.industry}>
          <Select value={data.industry} onChange={(e) => update({ industry: e.target.value as never })}>
            <option value="">Select industry…</option>
            {["Home Care Agency","Healthcare Staffing","Nursing Agency","Disability Support","Hospital","Community Care","Other"].map(i => <option key={i}>{i}</option>)}
          </Select>
        </Field>
        <Field label="Country" error={errors.country}>
          <Select value={data.country} onChange={(e) => update({ country: e.target.value, complianceCountry: e.target.value })}>
            <option value="">Select country…</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Current Systems Used"><TextInput value={data.currentSystems} onChange={(e) => update({ currentSystems: e.target.value })} placeholder="e.g. Excel, ADP, Custom CRM" /></Field>
        <Field label="Number of Employees"><TextInput type="number" value={data.employees} onChange={(e) => update({ employees: e.target.value })} placeholder="50" /></Field>
        <Field label="Number of Clients"><TextInput type="number" value={data.clients} onChange={(e) => update({ clients: e.target.value })} placeholder="120" /></Field>
        <Field label="Number of Locations"><TextInput type="number" value={data.locations} onChange={(e) => update({ locations: e.target.value })} placeholder="3" /></Field>
      </div>
      <div className="space-y-1.5">
        <Field label="Describe your organization"><TextArea value={data.orgDescription} onChange={(e) => update({ orgDescription: e.target.value })} placeholder="History, structure, size, regions served…" /></Field>
        {canSuggest && <AISuggestButton field="orgDescription" suggesting={suggesting} onSuggest={suggest} />}
      </div>
      <div className="space-y-1.5">
        <Field label="What services do you provide?"><TextArea value={data.services} onChange={(e) => update({ services: e.target.value })} /></Field>
        {canSuggest && <AISuggestButton field="services" suggesting={suggesting} onSuggest={suggest} />}
      </div>
      <div className="space-y-1.5">
        <Field label="What business challenges are you trying to solve?"><TextArea value={data.challenges} onChange={(e) => update({ challenges: e.target.value })} /></Field>
        {canSuggest && <AISuggestButton field="challenges" suggesting={suggesting} onSuggest={suggest} />}
      </div>
    </div>
  );
}

function AISuggestButton({ field, suggesting, onSuggest }: { field: "challenges" | "services" | "orgDescription"; suggesting: string | null; onSuggest: (f: "challenges" | "services" | "orgDescription") => void }) {
  const active = suggesting === field;
  return (
    <button
      type="button"
      onClick={() => onSuggest(field)}
      disabled={!!suggesting}
      aria-label={`AI suggest content for ${field}`}
      className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
    >
      <span aria-hidden="true">✦</span>
      {active ? "Generating suggestion…" : "AI Suggest"}
    </button>
  );
}

export function S2Roles() {
  const { data, update } = useDiscovery();
  const errors = useValidationErrors();
  const updateRoleDetail = (role: string, key: "canView" | "canEdit" | "approvals", value: string) => {
    const existing = data.roleDetails.find(r => r.role === role);
    const others = data.roleDetails.filter(r => r.role !== role);
    const merged = existing ? { ...existing, [key]: value } : { role, canView: "", canEdit: "", approvals: "", [key]: value };
    update({ roleDetails: [...others, merged] });
  };
  const detail = (role: string) => data.roleDetails.find(r => r.role === role) ?? { role, canView: "", canEdit: "", approvals: "" };
  return (
    <div className="space-y-6">
      <SectionHeader title="User Roles & Permissions" subtitle="We'll build a role matrix from your selections." />
      <Field label="Who will use the system?" error={errors.userRoles}>
        <MultiSelect options={ROLES} value={data.userRoles} onChange={(v) => update({ userRoles: v })} columns={3} />
      </Field>
      {data.userRoles.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">Define permissions per role</div>
          {data.userRoles.map(role => {
            const d = detail(role);
            return (
              <div key={role} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="text-sm font-semibold text-primary">{role}</div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="Can view"><TextInput value={d.canView} onChange={(e) => updateRoleDetail(role, "canView", e.target.value)} placeholder="e.g. all shifts" /></Field>
                  <Field label="Can edit"><TextInput value={d.canEdit} onChange={(e) => updateRoleDetail(role, "canEdit", e.target.value)} placeholder="e.g. own profile" /></Field>
                  <Field label="Approvals"><TextInput value={d.approvals} onChange={(e) => updateRoleDetail(role, "approvals", e.target.value)} placeholder="e.g. timesheets" /></Field>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function S3Staff() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Staff Management Requirements" subtitle="Track everything required to keep your workforce compliant." />
      <Field label="What do you need to manage?">
        <MultiSelect
          options={["Employee Records","Certifications","Licenses","Training Records","Compliance Documents","Leave Requests"]}
          value={data.staffFeatures}
          onChange={(v) => update({ staffFeatures: v })}
          columns={3}
        />
      </Field>
      <Field label="Required employee information" hint="List the fields that must exist on every employee profile.">
        <TextArea value={data.employeeInfo} onChange={(e) => update({ employeeInfo: e.target.value })} placeholder="Full name, DOB, NI number, emergency contact, qualifications…" />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Toggle checked={data.certExpiryTracking} onChange={(v) => update({ certExpiryTracking: v })} label="Certification expiry tracking" />
        <Toggle checked={data.autoRenewal} onChange={(v) => update({ autoRenewal: v })} label="Automated renewal reminders" />
      </div>
    </div>
  );
}

export function S4Clients() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Client Management Requirements" subtitle="The information you need to safely deliver care." />
      <Toggle checked={data.managesClients} onChange={(v) => update({ managesClients: v })} label="We manage clients/patients" />
      {data.managesClients && (
        <>
          <Field label="Client data captured">
            <MultiSelect
              options={["Client Profiles","Care Plans","Risk Assessments","Medication Records","Emergency Contacts","Service Agreements"]}
              value={data.clientFeatures}
              onChange={(v) => update({ clientFeatures: v })}
              columns={3}
            />
          </Field>
          <Field label="What information must be stored for each client?">
            <TextArea value={data.clientInfo} onChange={(e) => update({ clientInfo: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  );
}

export function S5Shifts() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Scheduling & Shift Management" />
      <Toggle checked={data.hasShifts} onChange={(v) => update({ hasShifts: v })} label="Our staff work shifts" />
      {data.hasShifts && (
        <>
          <Field label="Shift patterns used">
            <MultiSelect options={["Fixed shifts","Rotating shifts","Recurring shifts","Overnight shifts","Weekend shifts"]} value={data.shiftTypes} onChange={(v) => update({ shiftTypes: v })} columns={3} />
          </Field>
          <Field label="How are shifts assigned?">
            <TextArea value={data.shiftAssignment} onChange={(e) => update({ shiftAssignment: e.target.value })} placeholder="Manual, auto-match by skill, self-claim…" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Toggle checked={data.swapsAllowed} onChange={(v) => update({ swapsAllowed: v })} label="Staff can swap shifts" />
            <Toggle checked={data.swapApproval} onChange={(v) => update({ swapApproval: v })} label="Managers approve swaps" />
          </div>
        </>
      )}
    </div>
  );
}

export function S6Timesheet() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Timesheet Management" subtitle="How time gets captured at the source." />
      <Field label="How do staff record time?">
        <MultiSelect options={["Clock In / Clock Out","Manual Entry","GPS Verification","QR Code Check-In","Mobile App","Web Portal"]} value={data.timeMethods} onChange={(v) => update({ timeMethods: v })} columns={3} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Toggle checked={data.breaksTracked} onChange={(v) => update({ breaksTracked: v })} label="Track breaks" />
        <Toggle checked={data.overtimeCalc} onChange={(v) => update({ overtimeCalc: v })} label="Calculate overtime automatically" />
        <Toggle checked={data.missedClockIns} onChange={(v) => update({ missedClockIns: v })} label="Allow missed clock-in entries" />
      </div>
      <Field label="How is overtime approved?">
        <TextArea value={data.overtimeApproval} onChange={(e) => update({ overtimeApproval: e.target.value })} rows={3} />
      </Field>
    </div>
  );
}

export function S7Approval() {
  const { data, update } = useDiscovery();
  const setLevel = (i: number, approver: string) => {
    const next = [...data.approvalLevels];
    next[i] = { ...next[i], approver };
    update({ approvalLevels: next });
  };
  const addLevel = () => update({ approvalLevels: [...data.approvalLevels, { level: data.approvalLevels.length + 1, approver: "" }] });
  const removeLevel = (i: number) => update({ approvalLevels: data.approvalLevels.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, level: idx + 1 })) });
  return (
    <div className="space-y-6">
      <SectionHeader title="Approval Workflow" subtitle="Define the sign-off chain for timesheets." />
      <div className="space-y-2">
        {data.approvalLevels.map((lvl, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">L{lvl.level}</div>
            <TextInput value={lvl.approver} onChange={(e) => setLevel(i, e.target.value)} placeholder="Approver role" />
            <button onClick={() => removeLevel(i)} className="text-xs text-muted-foreground hover:text-destructive px-2">Remove</button>
          </div>
        ))}
        <button onClick={addLevel} className="text-sm text-primary hover:underline">+ Add approval level</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Toggle checked={data.delegationAllowed} onChange={(v) => update({ delegationAllowed: v })} label="Approvals can be delegated" />
        <Toggle checked={data.rejectedEditable} onChange={(v) => update({ rejectedEditable: v })} label="Rejected timesheets can be edited" />
      </div>
      <div className="glass-card rounded-xl p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Workflow preview</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-border bg-input px-3 py-2 text-xs">Staff submits</div>
          {data.approvalLevels.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12"><path d="M2 6h8m0 0L7 3m3 3L7 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">{l.approver || `Level ${l.level}`}</div>
            </div>
          ))}
          <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12"><path d="M2 6h8m0 0L7 3m3 3L7 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">Payroll</div>
        </div>
      </div>
    </div>
  );
}

export function S8Compliance() {
  const { data, update } = useDiscovery();
  const errors = useValidationErrors();
  const [generating, setGenerating] = useState(false);
  const [aiStandards, setAiStandards] = useState<string[]>([]);

  const staticStandards = COMPLIANCE_MAP[data.complianceCountry] ?? [];
  const allStandards = [...new Set([...staticStandards, ...aiStandards])];

  const generateCompliance = async () => {
    if (!data.complianceCountry) return;
    setGenerating(true);
    try {
      const result = await generateComplianceRequirements({
        data: { country: data.complianceCountry, industry: data.industry || "Healthcare" },
      });
      if (result.standards?.length) setAiStandards(result.standards);
      if (result.requirements) update({ complianceRequirements: result.requirements });
      if (result.retention) update({ retentionRecords: result.retention });
    } catch { /* silent */ } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Compliance & Regulations" />
      <Field label="Operating country" error={errors.complianceCountry}>
        <Select value={data.complianceCountry} onChange={(e) => { update({ complianceCountry: e.target.value }); setAiStandards([]); }}>
          <option value="">Select…</option>
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      {allStandards.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allStandards.map(s => <span key={s} className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">{s}</span>)}
        </div>
      )}
      {data.complianceCountry && (
        <button
          type="button"
          onClick={generateCompliance}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
        >
          <span aria-hidden="true">✦</span>
          {generating ? "Generating AI compliance data…" : "Generate AI compliance requirements"}
        </button>
      )}
      <Field label="What compliance requirements must be met?">
        <TextArea value={data.complianceRequirements} onChange={(e) => update({ complianceRequirements: e.target.value })} />
      </Field>
      <Field label="What records must be retained, and for how long?">
        <TextArea value={data.retentionRecords} onChange={(e) => update({ retentionRecords: e.target.value })} />
      </Field>
    </div>
  );
}

export function S9GPS() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="GPS & Attendance Verification" />
      <Toggle checked={data.attendanceVerification} onChange={(v) => update({ attendanceVerification: v })} label="We require attendance verification" />
      {data.attendanceVerification && (
        <>
          <Field label="Verification methods">
            <MultiSelect options={["GPS Tracking","Geofencing","QR Code","Client Signature","Photo Verification","NFC Tag"]} value={data.verificationMethods} onChange={(v) => update({ verificationMethods: v })} columns={3} />
          </Field>
          <Field label="How should attendance be validated?">
            <TextArea value={data.validationNotes} onChange={(e) => update({ validationNotes: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  );
}

export function S10Documents() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Document Management" />
      <Field label="Documents to be uploaded">
        <MultiSelect options={["Care Plans","Medication Logs","Incident Reports","Certifications","Contracts","Risk Assessments","Photos"]} value={data.documentTypes} onChange={(v) => update({ documentTypes: v })} columns={3} />
      </Field>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Storage requirements"><TextInput value={data.storageReq} onChange={(e) => update({ storageReq: e.target.value })} placeholder="e.g. EU-region S3" /></Field>
        <Field label="Retention period"><TextInput value={data.retentionPeriod} onChange={(e) => update({ retentionPeriod: e.target.value })} placeholder="e.g. 7 years" /></Field>
        <Field label="Access permissions"><TextInput value={data.accessPermissions} onChange={(e) => update({ accessPermissions: e.target.value })} placeholder="Role-based" /></Field>
      </div>
    </div>
  );
}

export function S11Payroll() {
  const { data, update } = useDiscovery();
  const errors = useValidationErrors();
  return (
    <div className="space-y-6">
      <SectionHeader title="Payroll & Billing" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Payroll system" error={errors.payrollSystem}>
          <Select value={data.payrollSystem} onChange={(e) => update({ payrollSystem: e.target.value })}>
            <option value="">Select…</option>
            {["Xero","QuickBooks","Sage","MYOB","Custom","None"].map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Billing model" error={errors.billingModel}>
          <Select value={data.billingModel} onChange={(e) => update({ billingModel: e.target.value })}>
            <option value="">Select…</option>
            {["Hourly","Daily","Weekly","Monthly"].map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Toggle checked={data.weekendRates} onChange={(v) => update({ weekendRates: v })} label="Different rates for weekends" />
        <Toggle checked={data.holidayRates} onChange={(v) => update({ holidayRates: v })} label="Different rates for holidays" />
        <Toggle checked={data.overtimeRates} onChange={(v) => update({ overtimeRates: v })} label="Overtime rates apply" />
        <Toggle checked={data.travelReimbursement} onChange={(v) => update({ travelReimbursement: v })} label="Travel reimbursement" />
      </div>
    </div>
  );
}

export function S12Reports() {
  const { data, update } = useDiscovery();
  const group = (title: string, options: string[]) => (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <MultiSelect options={options} value={data.reportsRequired} onChange={(v) => update({ reportsRequired: v })} columns={3} />
    </div>
  );
  return (
    <div className="space-y-6">
      <SectionHeader title="Reporting & Analytics" subtitle="Pick every report you'd want on day one." />
      {group("Operational", ["Attendance","Shift Utilization","Staff Performance"])}
      {group("Financial", ["Payroll","Revenue","Billing"])}
      {group("Compliance", ["Care Reports","Incident Reports","Audit Logs"])}
    </div>
  );
}

export function S13Notifications() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications & Communication" />
      <Field label="Preferred notification methods">
        <MultiSelect options={["Email","SMS","WhatsApp","Mobile Push Notifications"]} value={data.notificationMethods} onChange={(v) => update({ notificationMethods: v })} columns={2} />
      </Field>
      <Field label="Notification triggers">
        <MultiSelect options={["Shift Reminder","Missed Clock-In","Approval Required","Expiring Certification","Incident Reported","Schedule Change"]} value={data.notificationTriggers} onChange={(v) => update({ notificationTriggers: v })} columns={2} />
      </Field>
    </div>
  );
}

export function S14Integrations() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Integrations" />
      <Field label="Connect with">
        <MultiSelect
          options={["Microsoft 365","Google Workspace","Outlook Calendar","Xero","QuickBooks","Stripe","Twilio","WhatsApp Business API"]}
          value={data.integrations}
          onChange={(v) => update({ integrations: v })}
          columns={2}
        />
      </Field>
      <Field label="Custom integrations" hint="APIs, in-house tools, or specialty platforms">
        <TextArea value={data.customIntegrations} onChange={(e) => update({ customIntegrations: e.target.value })} />
      </Field>
    </div>
  );
}

export function S15Roadmap() {
  const { data, update } = useDiscovery();
  return (
    <div className="space-y-6">
      <SectionHeader title="Future Roadmap" subtitle="The capabilities we should design for, even if not built day one." />
      <MultiSelect
        options={["AI Scheduling","Route Optimization","Workforce Forecasting","Native Mobile App","Voice Notes","Predictive Analytics","Family Portal","Marketplace for Bank Staff"]}
        value={data.futureCapabilities}
        onChange={(v) => update({ futureCapabilities: v })}
        columns={2}
      />
    </div>
  );
}

export const SECTION_COMPONENTS = [
  S1Organization, S2Roles, S3Staff, S4Clients, S5Shifts, S6Timesheet, S7Approval,
  S8Compliance, S9GPS, S10Documents, S11Payroll, S12Reports, S13Notifications, S14Integrations, S15Roadmap,
];
