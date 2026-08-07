import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  SkipForward,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ParticipantId = number | string;

interface ChatMessage {
  id: string;
  sender: "user" | "other";
  content: string;
  timestamp: Date;
}

type RandomChatExperienceProps = {
  mode: "authenticated" | "anonymous";
  backPath: string;
  backLabel: string;
};

export default function RandomChatExperience({
  mode,
  backPath,
  backLabel,
}: RandomChatExperienceProps) {
  const [, navigate] = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [otherUser, setOtherUser] = useState<{
    id: ParticipantId;
    displayName: string;
  } | null>(null);
  const [sessionId, setSessionId] = useState<ParticipantId | null>(null);
  const [searchingCount, setSearchingCount] = useState(0);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [displayName, setDisplayName] = useState(
    mode === "anonymous" ? "Anonymous visitor" : ""
  );
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(window.location.origin, {
      auth: { mode },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError("");
    });
    socket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionError(
        mode === "anonymous"
          ? "Anonymous chat is temporarily unavailable. Please try again."
          : "Chat connection failed. Please sign in again or retry."
      );
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsSearching(false);
      setOtherUser(null);
      setSessionId(null);
    });
    socket.on("identity:ready", data => {
      if (typeof data?.displayName === "string") {
        setDisplayName(data.displayName);
      }
    });
    socket.on("stats:matching-queue", data => {
      if (
        data?.context === "random_matching_queue" &&
        data?.matchingState === "SEARCHING"
      ) {
        setSearchingCount(Number(data?.counts?.text) || 0);
      }
    });
    socket.on("chat:waiting", () => {
      setIsSearching(true);
    });
    socket.on("chat:matched", data => {
      setSessionId(data.sessionId);
      setOtherUser({
        id: data.matchedUserId,
        displayName: data.matchedDisplayName || "Connected visitor",
      });
      setIsSearching(false);
      setMessages([]);
    });
    socket.on("chat:partner-left", () => {
      setOtherUser(null);
      setSessionId(null);
      setMessages([]);
      setIsSearching(false);
      toast.info("The other person left the chat");
    });
    socket.on("message:received", data => {
      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          sender: "other",
          content: String(data.content),
          timestamp: new Date(data.timestamp),
        },
      ]);
    });
    socket.on("message:sent", data => {
      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          sender: "user",
          content: String(data.content),
          timestamp: new Date(data.timestamp),
        },
      ]);
    });
    socket.on("message:user-typing", () => setTypingIndicator(true));
    socket.on("message:user-stop-typing", () => setTypingIndicator(false));
    socket.on("message:flagged", data => {
      toast.warning(data?.reason || "That message was blocked");
    });
    socket.on("chat:error", data => {
      toast.error(data?.message || "Chat is temporarily unavailable");
      setIsSearching(false);
    });
    socket.on("chat:left-queue", () => setIsSearching(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingIndicator]);

  const startChat = () => {
    if (!socketRef.current?.connected) return;
    setIsSearching(true);
    socketRef.current.emit("chat:join-queue", { sessionType: "text" });
  };

  const skipChat = () => {
    setOtherUser(null);
    setMessages([]);
    setSessionId(null);
    setIsSearching(true);
    socketRef.current?.emit("chat:skip");
  };

  const endChat = () => {
    if (sessionId !== null) {
      socketRef.current?.emit("chat:end", { sessionId });
    }
    setOtherUser(null);
    setMessages([]);
    setSessionId(null);
    setIsSearching(false);
  };

  const sendMessage = () => {
    const content = messageInput.trim();
    if (!content || sessionId === null || !otherUser) return;

    socketRef.current?.emit("message:send", { sessionId, content });
    setMessageInput("");
    socketRef.current?.emit("message:stop-typing", { sessionId });
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MessageCircle className="h-6 w-6 shrink-0 text-purple-300" />
            <div className="min-w-0">
              <p className="truncate font-semibold">Random text chat</p>
              <p className="truncate text-xs text-slate-400">
                {displayName || "Secure session"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-2 text-xs sm:flex ${
                isConnected ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {isConnected ? `${searchingCount} searching` : "Connecting"}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(backPath)}
              className="min-h-11 border-white/15 bg-white/5 px-3 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{backLabel}</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {connectionError ? (
          <Card className="mx-auto max-w-lg border-amber-400/20 bg-slate-900/70 p-6 text-center">
            <h1 className="text-xl font-semibold text-white">
              Chat is not connected
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {connectionError}
            </p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-11 w-full bg-purple-600 text-white hover:bg-purple-500"
            >
              Retry connection
            </Button>
          </Card>
        ) : !otherUser ? (
          <div className="flex min-h-[65dvh] items-center justify-center">
            <Card className="w-full max-w-md border-white/10 bg-slate-900/70 p-6 text-center shadow-2xl backdrop-blur sm:p-9">
              {isSearching ? (
                <>
                  <Loader2 className="mx-auto h-11 w-11 animate-spin text-purple-300" />
                  <h1 className="mt-6 text-2xl font-bold">Finding someone…</h1>
                  <p className="mt-2 leading-6 text-slate-400">
                    Keep this page open while we look for another available
                    visitor.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      socketRef.current?.emit("chat:leave-queue");
                      setIsSearching(false);
                    }}
                    variant="outline"
                    className="mt-6 min-h-11 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel search
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15">
                    <Users className="h-8 w-8 text-purple-300" />
                  </div>
                  <h1 className="mt-6 text-2xl font-bold">
                    Ready for a conversation?
                  </h1>
                  <p className="mt-2 leading-6 text-slate-400">
                    Match with someone who is online now. You can skip or leave
                    at any time.
                  </p>
                  <Button
                    type="button"
                    onClick={startChat}
                    disabled={!isConnected}
                    className="mt-6 min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
                  >
                    Start chatting
                  </Button>
                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4" />
                    Moderated with rate and content controls
                  </p>
                </>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid min-h-[72dvh] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex min-h-[65dvh] flex-col">
              <Card className="min-h-0 flex-1 overflow-y-auto border-white/10 bg-slate-900/65 p-4 sm:p-6">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex min-h-48 items-center justify-center text-center text-sm text-slate-400">
                      You’re connected. Say hello when you’re ready.
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                            message.sender === "user"
                              ? "rounded-br-md bg-purple-600 text-white"
                              : "rounded-bl-md bg-slate-700 text-slate-100"
                          }`}
                        >
                          <p className="break-words text-sm leading-6">
                            {message.content}
                          </p>
                          <p className="mt-1 text-[11px] opacity-60">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {typingIndicator ? (
                    <div className="text-xs text-slate-400">
                      {otherUser.displayName} is typing…
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              </Card>

              <div className="mt-3 flex gap-2">
                <Input
                  value={messageInput}
                  maxLength={2_000}
                  onChange={event => {
                    setMessageInput(event.target.value);
                    socketRef.current?.emit("message:typing", { sessionId });
                  }}
                  onBlur={() =>
                    socketRef.current?.emit("message:stop-typing", {
                      sessionId,
                    })
                  }
                  onKeyDown={event => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message"
                  aria-label="Message"
                  className="min-h-12 flex-1 border-white/10 bg-slate-800 text-white placeholder:text-slate-500"
                />
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  aria-label="Send message"
                  className="h-12 w-12 bg-purple-600 p-0 text-white hover:bg-purple-500"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="border-white/10 bg-slate-900/65 p-5">
                <div className="flex items-center gap-3 lg:block lg:text-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 lg:mx-auto">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 lg:mt-3">
                    <p className="truncate font-semibold">
                      {otherUser.displayName}
                    </p>
                    <p className="text-sm text-emerald-300">Connected now</p>
                  </div>
                </div>
              </Card>

              <Card className="border-white/10 bg-slate-900/65 p-5">
                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={skipChat}
                    className="min-h-11 bg-amber-600 text-white hover:bg-amber-500"
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip
                  </Button>
                  <Button
                    type="button"
                    onClick={endChat}
                    className="min-h-11 bg-rose-600 text-white hover:bg-rose-500"
                  >
                    <X className="mr-2 h-4 w-4" />
                    End chat
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
