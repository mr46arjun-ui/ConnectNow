import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, X } from "lucide-react";

interface MessageReactionsUIProps {
  messageId: string;
  reactions?: Record<string, string[]>;
  onReactionAdd?: (emoji: string) => void;
  onReactionRemove?: (emoji: string) => void;
  currentUserId?: string;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

export default function MessageReactionsUI({
  messageId,
  reactions = {},
  onReactionAdd,
  onReactionRemove,
  currentUserId,
}: MessageReactionsUIProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    const userReacted = reactions[emoji]?.includes(currentUserId || "");
    if (userReacted) {
      onReactionRemove?.(emoji);
    } else {
      onReactionAdd?.(emoji);
    }
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Display Existing Reactions */}
      {Object.entries(reactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => handleEmojiSelect(emoji)}
          className={`px-2 py-1 rounded-full text-sm font-medium transition-all ${
            users.includes(currentUserId || "")
              ? "bg-purple-600/50 border border-purple-500"
              : "bg-slate-700/50 border border-slate-600 hover:bg-slate-700"
          }`}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-xs">{users.length}</span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-slate-700/50"
          >
            <Smile className="w-4 h-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-slate-800 border-purple-500/20">
          <div className="grid grid-cols-4 gap-2">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 rounded hover:bg-slate-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
