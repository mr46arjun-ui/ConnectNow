import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: number;
  onReactionAdd?: (emoji: string) => void;
  reactions?: Record<string, number>;
}

export default function MessageReactions({
  messageId,
  onReactionAdd,
  reactions = {},
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleReactionClick = (emoji: string) => {
    onReactionAdd?.(emoji);
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap" ref={pickerRef}>
      {/* Existing Reactions */}
      {Object.entries(reactions).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className="px-2 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-sm transition flex items-center gap-1"
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-xs text-slate-300">{count}</span>}
        </button>
      ))}

      {/* Quick Reactions */}
      {showPicker && (
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-2">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className="text-xl hover:bg-slate-700 rounded p-1 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Add Reaction Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 rounded hover:bg-slate-700 transition text-slate-400 hover:text-slate-200"
      >
        <SmilePlus className="w-4 h-4" />
      </button>
    </div>
  );
}
