import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-3/4 bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg">
          <Skeleton className="w-12 h-12 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-3 w-48 bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 bg-slate-700" />
          </div>
          <Skeleton className="h-8 w-16 bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Icon className="w-12 h-12 text-gray-500" />
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-xs">{description}</p>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-xs">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
