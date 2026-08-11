import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-white/10 bg-slate-900/70 p-7 text-center shadow-2xl">
            <AlertTriangle
              size={48}
              className="mb-6 flex-shrink-0 text-amber-400"
            />

            <h1 className="text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="mt-3 leading-6 text-slate-400">
              The page could not finish loading. Reload it to try again.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-500"
            >
              <RotateCcw size={16} />
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
