import { Component, type ReactNode } from "react";
import { Sentry } from "@/lib/sentry";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class WizardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">Something went wrong in this section.</p>
          <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-border px-4 py-2 text-xs hover:border-primary/30"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
