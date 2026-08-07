import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingState({ message = "Loading...", fullPage = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-700/50 rounded-lg animate-pulse h-16" />
      ))}
    </div>
  );
}

export function ErrorState({ 
  message = "Something went wrong", 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
      <div className="text-red-400 text-lg">⚠️</div>
      <p className="text-red-400 text-center text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-purple-400 hover:text-purple-300 underline mt-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ 
  message = "No items found",
  icon = "📭"
}: { 
  message?: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4">
      <div className="text-4xl">{icon}</div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
