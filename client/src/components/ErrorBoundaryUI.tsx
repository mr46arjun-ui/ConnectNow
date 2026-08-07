import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryUIProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorBoundaryUI({
  error,
  resetError,
}: ErrorBoundaryUIProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-red-500/20 rounded-lg p-8">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-400 text-center mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <Button
          onClick={resetError}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
