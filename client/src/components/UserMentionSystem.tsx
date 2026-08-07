import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AtSign } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
}

interface UserMentionSystemProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (user: User) => void;
  availableUsers?: User[];
  placeholder?: string;
}

export default function UserMentionSystem({
  value,
  onChange,
  onMentionSelect,
  availableUsers = [],
  placeholder = "Type a name to mention someone...",
}: UserMentionSystemProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStart, setMentionStart] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);
    setCursorPosition(e.target.selectionStart || 0);

    const cursor = e.target.selectionStart || 0;
    const token = text.slice(0, cursor).match(/(?:^|\s)@?([A-Za-z0-9_-]+)$/);
    if (!token?.[1]) {
      setShowMentions(false);
      return;
    }
    setMentionSearch(token[1]);
    setMentionStart(cursor - token[0].trimStart().length);
    setShowMentions(true);
  };

  const handleMentionSelect = (user: User) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPosition);
    const newText = `${beforeMention}${user.username || user.name} ${afterMention}`;

    onChange(newText);
    onMentionSelect?.(user);
    setShowMentions(false);
    setMentionSearch("");
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const nextCursor =
        beforeMention.length + (user.username || user.name).length + 1;
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const filteredUsers = availableUsers.filter(user =>
    (user.username || user.name)
      .toLowerCase()
      .includes(mentionSearch.toLowerCase())
  );

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionsRef.current &&
        !mentionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <AtSign className="absolute left-3 top-3 w-5 h-5 text-purple-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Mention Suggestions */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {filteredUsers.map(user => (
            <button
              key={user.id}
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={event => {
                event.stopPropagation();
                handleMentionSelect(user);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 transition-colors text-left"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {(user.username || user.name)
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {user.username || user.name}
                </p>
                <p className="text-xs text-gray-400">{user.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showMentions && mentionSearch && filteredUsers.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg z-50 p-3">
          <p className="text-sm text-gray-400 text-center">No users found</p>
        </div>
      )}
    </div>
  );
}
