import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import NavigationLayout from "@/components/NavigationLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Trash2,
  Edit2,
  Smile,
  Users as UsersIcon,
  Home as RoomsIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ActiveUsersDesktopPanel } from "@/components/ActiveUsersDesktopPanel";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  reactions?: Array<{ emoji: string; users: number[] }>;
}

interface MessageWithEdit extends Message {
  isEditing?: boolean;
  editedContent?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<MessageWithEdit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [segment, setSegment] = useState<"people" | "rooms">("people");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const {
    data: friendsList,
    isLoading: friendsLoading,
    error: friendsError,
  } = trpc.friends.getFriendsList.useQuery();
  const {
    data: privateMessages,
    isLoading: messagesLoading,
    error: messagesError,
  } = trpc.messages.getConversation.useQuery(
    selectedFriendId
      ? { userId: selectedFriendId, limit: 100 }
      : { userId: 0, limit: 100 },
    { enabled: !!selectedFriendId }
  );

  const editMessageMutation = trpc.messages.edit.useMutation({
    onError: () => toast.error("Failed to edit message"),
  });
  const deleteMessageMutation = trpc.messages.delete.useMutation({
    onError: () => toast.error("Failed to delete message"),
  });
  const addReactionMutation = trpc.messages.addReaction.useMutation({
    onError: () => toast.error("Failed to add reaction"),
  });
  const removeReactionMutation = trpc.messages.removeReaction.useMutation({
    onError: () => toast.error("Failed to remove reaction"),
  });

  // Message sending handled via Socket.IO

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }

    const socket = io(window.location.origin, {
      auth: { userId: user.id },
    });

    socketRef.current = socket;

    socket.on("private-message:received", (data: any) => {
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: new Date(data.timestamp),
          isRead: false,
        },
      ]);
    });
    socket.on("private-message:sent", (data: any) => {
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          senderId: user.id,
          senderName: user.name || user.username || "You",
          content: data.content,
          timestamp: new Date(data.timestamp),
          isRead: true,
        },
      ]);
    });
    socket.on("private-message:flagged", (data: any) => {
      toast.warning(data?.reason || "That message was blocked");
    });
    socket.on("chat:error", (data: any) => {
      toast.error(data?.message || "The message could not be sent");
    });

    return () => {
      socket.disconnect();
    };
  }, [user, setLocation]);

  useEffect(() => {
    if (privateMessages) {
      setMessages(
        [...privateMessages].reverse().map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName || "User",
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          isRead: msg.isRead || false,
        }))
      );
    }
  }, [privateMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedFriendId) return;

    // Send message via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit("private-message:send", {
        receiverId: selectedFriendId,
        content: messageText,
      });
    }

    setMessageText("");
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editingContent.trim()) return;

    try {
      await editMessageMutation.mutateAsync({
        messageId,
        content: editingContent,
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, content: editingContent } : msg
        )
      );

      setEditingMessageId(null);
      setEditingContent("");
      toast.success("Message updated");
    } catch (error) {
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessageMutation.mutateAsync({ messageId });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      await addReactionMutation.mutateAsync({
        messageId,
        emoji,
      });

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.emoji === emoji);

            if (existingReaction) {
              if (!existingReaction.users.includes(user!.id)) {
                existingReaction.users.push(user!.id);
              }
            } else {
              reactions.push({ emoji, users: [user!.id] });
            }

            return { ...msg, reactions };
          }
          return msg;
        })
      );

      setShowEmojiPicker(null);
      toast.success("Reaction added");
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const handleTagUser = (handle: string) => {
    setMessageText(prev => {
      const endsWithSpace = prev.endsWith(" ");
      const prefix = prev && !endsWithSpace ? " " : "";
      return prev + prefix + "@" + handle + " ";
    });
  };

  if (!user) return null;

  const filteredFriends = friendsList?.filter((friend: any) =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avatarColors = [
    "from-emerald-500 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-blue-500 to-indigo-600",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-600",
  ];

  return (
    <NavigationLayout activeTab="messages">
      <div className="space-y-4 max-w-6xl mx-auto">
        {/* Top Header Segmented Switcher */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 sm:p-3 rounded-2xl">
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setSegment("people")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-black text-xs tracking-wider transition-all ${
                segment === "people"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" />
              People
            </button>
            <button
              onClick={() => setLocation("/rooms")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-black text-xs tracking-wider transition-all ${
                segment === "rooms"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RoomsIcon className="w-3.5 h-3.5" />
              Rooms
            </button>
          </div>
        </div>

        {/* Main Messenger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[620px]">
          {/* Friends & Conversations List */}
          <Card className="bg-slate-900 border-slate-800 p-4 flex flex-col rounded-2xl">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-white text-xs placeholder-slate-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                Your Conversations
              </p>
              {filteredFriends && filteredFriends.length > 0 ? (
                filteredFriends.map((friend: any, index: number) => {
                  const isSelected = selectedFriendId === friend.id;
                  const colorGradient = avatarColors[index % avatarColors.length];
                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                        isSelected
                          ? "bg-cyan-600/20 border-cyan-500/50 text-white"
                          : "bg-slate-950/50 border-slate-800/60 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorGradient} text-white font-black flex items-center justify-center text-sm shadow-md shrink-0`}>
                        {friend.name ? friend.name.substring(0, 3).toUpperCase() : friend.username.substring(0, 3).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-white truncate">{friend.name}</p>
                          <span className="text-[10px] text-slate-500">active</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-center py-8 text-xs">No friends found. Add friends from the People tab!</p>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-purple-500/20 p-4 flex flex-col">
            {selectedFriendId ? (
              <>
                {/* Messages */}
                <div className="flex-grow overflow-y-auto mb-4 space-y-3 pr-2">
                  {messages.length > 0 ? (
                    messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex group ${
                        msg.senderId === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg relative ${
                            msg.senderId === user.id
                              ? "bg-purple-600 text-white rounded-br-none"
                              : "bg-slate-700 text-gray-100 rounded-bl-none"
                          }`}
                        >
                          {editingMessageId === msg.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingContent}
                                onChange={e =>
                                  setEditingContent(e.target.value)
                                }
                                className="bg-slate-600 text-white text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleEditMessage(msg.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMessageId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Message Actions */}
                        {msg.senderId === user.id &&
                          editingMessageId !== msg.id && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingContent(msg.content);
                                }}
                                className="text-gray-400 hover:text-white h-6 w-6 p-0"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <Popover
                                open={showEmojiPicker === msg.id}
                                onOpenChange={open =>
                                  setShowEmojiPicker(open ? msg.id : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white h-6 w-6 p-0"
                                  >
                                    <Smile className="w-3 h-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-2" side="top">
                                  <div className="grid grid-cols-8 gap-1">
                                    {[
                                      "👍",
                                      "❤️",
                                      "😂",
                                      "😮",
                                      "😢",
                                      "😡",
                                      "🎉",
                                      "🔥",
                                    ].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() =>
                                          handleAddReaction(msg.id, emoji)
                                        }
                                        className="text-xl hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}

                        {/* Reactions Display */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1 px-2">
                            {msg.reactions.map(reaction => (
                              <button
                                key={reaction.emoji}
                                onClick={() =>
                                  reaction.users.includes(user.id)
                                    ? removeReactionMutation.mutate({
                                        messageId: msg.id,
                                        emoji: reaction.emoji,
                                      })
                                    : handleAddReaction(msg.id, reaction.emoji)
                                }
                                className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                  reaction.users.includes(user.id)
                                    ? "bg-purple-700 text-white"
                                    : "bg-slate-800 text-gray-300"
                                }`}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No messages yet. Say hello!
                  </p>
                )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Box */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="bg-slate-700 border-purple-500/20 text-white placeholder-gray-400"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="border-purple-500/20 text-gray-400 hover:text-white">
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 bg-slate-800 border-purple-500/20">
                        <div className="grid grid-cols-6 gap-2">
                          {["😀", "😂", "😍", "🎉", "🔥", "👍", "❤️", "🙌", "😊", "😎", "🚀", "✨"].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setMessageText(prev => prev + emoji);
                              }}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Select a friend to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>

          {/* Desktop Active Users Side Window */}
          <ActiveUsersDesktopPanel onTagUser={handleTagUser} />
        </div>
      </div>
    </NavigationLayout>
  );
}
