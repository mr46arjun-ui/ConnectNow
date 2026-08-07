import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  variant?: "dots" | "wave" | "pulse";
}

export default function TypingIndicator({
  isTyping,
  userName = "Someone",
  variant = "dots",
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  if (variant === "dots") {
    return (
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <span>{userName} is typing</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100" />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <span>{userName} is typing</span>
        <div className="flex gap-0.5 h-3">
          <div className="w-1 bg-purple-400 rounded-full animate-pulse" />
          <div className="w-1 bg-purple-400 rounded-full animate-pulse delay-100" />
          <div className="w-1 bg-purple-400 rounded-full animate-pulse delay-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <span>{userName} is typing</span>
      <div className="inline-flex gap-1">
        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// Multiple users typing indicator
interface MultipleTypingIndicatorProps {
  typingUsers: string[];
  maxDisplay?: number;
}

export function MultipleTypingIndicator({
  typingUsers,
  maxDisplay = 3,
}: MultipleTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const displayUsers = typingUsers.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, typingUsers.length - maxDisplay);

  let message = "";
  if (displayUsers.length === 1) {
    message = `${displayUsers[0]} is typing`;
  } else if (displayUsers.length === 2) {
    message = `${displayUsers[0]} and ${displayUsers[1]} are typing`;
  } else {
    message = `${displayUsers.slice(0, -1).join(", ")} and ${displayUsers[displayUsers.length - 1]} are typing`;
  }

  if (hiddenCount > 0) {
    message += ` +${hiddenCount} more`;
  }

  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2 px-3 bg-slate-800/30 rounded-lg">
      <span>{message}</span>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200" />
      </div>
    </div>
  );
}
