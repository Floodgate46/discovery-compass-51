import { ReactNode } from "react";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="block space-y-2">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {children}
      {error && (
        <div role="alert" aria-live="polite" className="text-xs text-destructive mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

export function TextInput({ "aria-describedby": describedBy, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      aria-invalid={props["aria-invalid"]}
      aria-describedby={describedBy}
      {...props}
      className="w-full rounded-lg bg-input border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      {...props}
      className="w-full rounded-lg bg-input border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 resize-y"
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg bg-input border border-border px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
    >
      {children}
    </select>
  );
}

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2 | 3;
  "aria-label"?: string;
}
export function MultiSelect({ options, value, onChange, columns = 2, "aria-label": ariaLabel }: MultiSelectProps) {
  const cols = columns === 1 ? "grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className={`grid grid-cols-1 ${cols} gap-2`} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm text-left transition ${
              active
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-input text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                active ? "border-primary bg-primary" : "border-border bg-background"
              }`}
            >
              {active && (
                <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                  <path d="M4 10l4 4 8-8" stroke="oklch(0.15 0.03 250)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="truncate">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm transition hover:border-primary/30"
    >
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1.5 pb-2">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
