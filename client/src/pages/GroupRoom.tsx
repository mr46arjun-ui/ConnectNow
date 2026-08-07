import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AudioMessagePlayer } from "@/components/AudioMessagePlayer";
import { GroupMediaPicker, type GifAsset } from "@/components/GroupMediaPicker";
import {
  CyberAnimeEmoticon,
  cyberEmotionFromToken,
} from "@/components/CyberAnimeEmoticon";
import {
  CuteSticker,
  cuteStickerSelectionFromToken,
} from "@/components/CuteSticker";
import {
  ClayMochiEmoji,
} from "@/components/ClayMochiEmoji";
import {
  clayMochiSelectionFromToken,
} from "@/components/clay-mochi-catalog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { uploadGroupVoiceNote } from "@/lib/group-media-upload";
import {
  contentMentionsHandle,
  getMentionRange,
  insertMentionAtRange,
  type MentionRange,
} from "@shared/group-mentions";
import {
  ArrowLeft,
  AtSign,
  Ban,
  Crown,
  Image,
  Info,
  Loader2,
  LogOut,
  MessageSquare,
  Paperclip,
  Phone,
  Reply,
  Send,
  Save,
  Share2,
  ShieldCheck,
  Smile,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type GroupMember = {
  membershipId: number;
  userId: number;
  username: string | null;
  name: string | null;
  avatar: string | null;
  isVerified: boolean | null;
  role: "admin" | "co_admin" | "moderator" | "member";
  joinedAt: string | Date;
  handle: string;
  displayName: string;
};

type GroupMessageReaction = {
  id: number;
  userId: number;
  participantKey: string;
  emoji: string;
};

type GroupMessage = {
  id: number;
  groupId: number;
  senderId: number;
  senderUsername: string | null;
  senderName: string | null;
  senderAvatar: string | null;
  senderHandle: string;
  senderDisplayName: string;
  content: string;
  messageType?: "text" | "image" | "video" | "file" | "audio" | "system";
  mediaUrl?: string | null;
  mentions: number[];
  reactions?: GroupMessageReaction[];
  isEdited: boolean;
  timestamp: string | Date;
};

type ActiveGroupMember = {
  participantId: string;
  userId: number | null;
  displayName: string;
  isAnonymous: boolean;
};

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "😮"];

export default function GroupRoom() {
  const [, params] = useRoute("/groups/:groupId");
  const groupId = Number(params?.groupId);
  const validGroupId = Number.isInteger(groupId) && groupId > 0;
  const { user, loading } = useAuth();
  const isAnonymous = Boolean(getAnonymousSession());
  const canAccessGroup = Boolean(user) || isAnonymous;

  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [mentionRange, setMentionRange] = useState<MentionRange | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: number; displayName: string }>
  >([]);
  const [inviteUserId, setInviteUserId] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [activeUsersOpen, setActiveUsersOpen] = useState(false);
  const [activeGroupMembers, setActiveGroupMembers] = useState<
    ActiveGroupMember[]
  >([]);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    number | null
  >(null);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem("connectnow_muted") === "true"
  );
  const [replyToMessage, setReplyToMessage] = useState<GroupMessage | null>(
    null
  );
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [moderationTarget, setModerationTarget] = useState<GroupMember | null>(
    null
  );
  const [banType, setBanType] = useState<"temporary" | "permanent">(
    "temporary"
  );
  const [banHours, setBanHours] = useState("24");
  const [banReason, setBanReason] = useState("Violation of group rules");

  const playSound = (type: "send" | "receive" | "mention") => {
    if (isMuted) return;
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "send") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "receive") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "mention") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem("connectnow_muted", String(next));
      toast.info(next ? "Audio sounds muted" : "Audio sounds enabled");
      return next;
    });
  };

  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageFeedRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const feedPinnedToBottomRef = useRef(true);
  const feedPositionedRef = useRef(false);
  const typingTimeouts = useRef(
    new Map<number, ReturnType<typeof setTimeout>>()
  );
  const ownTypingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceUploadUrlsRef = useRef(new Map<string, string>());

  const groupQuery = trpc.groups.getById.useQuery(
    { groupId },
    { enabled: canAccessGroup && validGroupId, retry: false }
  );
  const membersQuery = trpc.groups.getMembers.useQuery(
    { groupId },
    { enabled: canAccessGroup && validGroupId, retry: false }
  );
  const messagesQuery = trpc.groups.getMessages.useQuery(
    { groupId, limit: 100 },
    { enabled: canAccessGroup && validGroupId, retry: false }
  );
  const activeCallQuery = trpc.groups.getActiveCall.useQuery(
    { groupId },
    {
      enabled: canAccessGroup && validGroupId,
      retry: false,
      refetchInterval: 30_000,
    }
  );
  const friendsQuery = trpc.friends.getFriendsList.useQuery(undefined, {
    enabled: Boolean(user) && validGroupId,
  });
  const selectedUserProfileQuery = trpc.profile.getProfile.useQuery(
    { userId: selectedProfileUserId! },
    {
      enabled: Boolean(selectedProfileUserId && selectedProfileUserId > 0),
      retry: false,
    }
  );
  const sendFriendRequest = trpc.friends.sendRequest.useMutation({
    onSuccess: () => {
      toast.success("Friend request sent!");
    },
    onError: error => {
      toast.error(error.message || "Failed to send friend request");
    },
  });
  const inviteMember = trpc.groups.invite.useMutation({
    onError: error => toast.error(error.message || "Invitation failed"),
  });
  const removeMember = trpc.groups.removeMember.useMutation({
    onError: error => toast.error(error.message || "Member removal failed"),
  });
  const setMemberRole = trpc.groups.setMemberRole.useMutation({
    onError: error => toast.error(error.message || "Role update failed"),
  });
  const banMember = trpc.groups.banMember.useMutation({
    onError: error => toast.error(error.message || "Ban failed"),
  });
  const updateGroup = trpc.groups.update.useMutation({
    onError: error => toast.error(error.message || "Group update failed"),
  });
  const leaveGroup = trpc.groups.leave.useMutation({
    onError: error => toast.error(error.message || "Unable to leave group"),
  });
  const markRead = trpc.groups.markRead.useMutation({
    onSuccess: () => {
      void utils.notifications.getNotifications.invalidate();
      void utils.notifications.getUnreadCount.invalidate();
    },
  });

  const members = (membersQuery.data ?? []) as GroupMember[];
  const currentMember = members.find(member => member.userId === user?.id);
  const isCreator = Boolean(user?.id && groupQuery.data?.createdBy === user.id);
  const canManageStaff =
    currentMember?.role === "admin" || currentMember?.role === "co_admin";
  const canModerate = canManageStaff || currentMember?.role === "moderator";
  const canStartCall = canModerate;
  const bansQuery = trpc.groups.getBans.useQuery(
    { groupId },
    { enabled: isCreator && validGroupId, retry: false }
  );
  const unbanMember = trpc.groups.unbanMember.useMutation({
    onError: error => toast.error(error.message || "Unable to remove ban"),
  });
  const showManagementSidebar = Boolean(
    canManageStaff || (isCreator && bansQuery.data?.length)
  );

  useEffect(() => {
    if (!validGroupId) {
      navigate("/groups", { replace: true });
      return;
    }
    if (!loading && !user && !isAnonymous)
      navigate("/guest-login", { replace: true });
  }, [isAnonymous, loading, navigate, user, validGroupId]);

  useEffect(() => {
    if (!messagesQuery.data) return;
    setMessages(previous => {
      const merged = new Map<number, GroupMessage>();
      for (const message of messagesQuery.data as GroupMessage[]) {
        merged.set(message.id, message);
      }
      for (const message of previous) {
        if (message.groupId === groupId) merged.set(message.id, message);
      }
      return [...merged.values()].sort((first, second) => first.id - second.id);
    });
  }, [groupId, messagesQuery.data]);

  useEffect(() => {
    if (!canAccessGroup || !validGroupId || groupQuery.error) return;
    const socket = io(window.location.origin, {
      auth: { mode: user ? "authenticated" : "anonymous" },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketReady(false);
      socket.emit("group:join", { groupId });
    });
    socket.on("group:joined", data => {
      if (Number(data?.groupId) === groupId) {
        setIsSocketReady(true);
        void Promise.all([
          utils.groups.getMembers.invalidate({ groupId }),
          utils.groups.getById.invalidate({ groupId }),
          utils.groups.list.invalidate(),
          utils.groups.getActiveCall.invalidate({ groupId }),
        ]);
      }
    });
    socket.on("group:presence", data => {
      if (Number(data?.groupId) !== groupId) return;
      const activeMembers = Array.isArray(data?.members)
        ? data.members.filter(
            (member: ActiveGroupMember) =>
              typeof member?.participantId === "string" &&
              typeof member?.displayName === "string"
          )
        : [];
      setActiveGroupMembers(activeMembers);
    });
    socket.on("disconnect", () => {
      setIsSocketReady(false);
      setActiveGroupMembers([]);
    });
    socket.on("connect_error", () => {
      setIsSocketReady(false);
      toast.error("Live group connection is unavailable");
    });
    socket.on("group:error", data => {
      toast.error(data?.message || "The group action failed");
    });
    socket.on("group:access-revoked", data => {
      if (Number(data?.groupId) !== groupId) return;
      toast.error(data?.message || "Your access to this group was revoked");
      navigate("/groups", { replace: true });
    });
    socket.on("group:message", (message: GroupMessage) => {
      if (Number(message?.groupId) !== groupId) return;
      setMessages(previous =>
        previous.some(existing => existing.id === message.id)
          ? previous
          : [...previous, message]
      );
      setTypingUsers(previous =>
        previous.filter(item => item.userId !== message.senderId)
      );

      // Play audio notification sound
      const currentUserId = user?.id ?? 0;
      if (message.senderId !== currentUserId) {
        if (currentUserId > 0 && message.mentions.includes(currentUserId)) {
          playSound("mention");
        } else {
          playSound("receive");
        }
      }
    });
    socket.on("group:message-deleted", data => {
      if (Number(data?.groupId) !== groupId) return;
      setMessages(previous =>
        previous.filter(message => message.id !== Number(data.messageId))
      );
    });
    socket.on(
      "group:reaction-updated",
      (data: {
        messageId: number;
        groupId: number;
        reactions: GroupMessageReaction[];
      }) => {
        if (Number(data?.groupId) !== groupId) return;
        setMessages(previous =>
          previous.map(message =>
            message.id === Number(data.messageId)
              ? { ...message, reactions: data.reactions }
              : message
          )
        );
      }
    );
    socket.on("group-call:started", data => {
      if (Number(data?.groupId) !== groupId) return;
      void utils.groups.getActiveCall.invalidate({ groupId });
    });
    socket.on("group-call:ended", data => {
      if (Number(data?.groupId) !== groupId) return;
      void utils.groups.getActiveCall.invalidate({ groupId });
    });
    socket.on("group:typing", data => {
      if (
        Number(data?.groupId) !== groupId ||
        !Number.isInteger(Number(data?.userId))
      ) {
        return;
      }
      const typingUserId = Number(data.userId);
      const existingTimeout = typingTimeouts.current.get(typingUserId);
      if (existingTimeout) clearTimeout(existingTimeout);
      if (!data.isTyping) {
        setTypingUsers(previous =>
          previous.filter(item => item.userId !== typingUserId)
        );
        return;
      }
      setTypingUsers(previous => [
        ...previous.filter(item => item.userId !== typingUserId),
        {
          userId: typingUserId,
          displayName: String(data.displayName || "Someone"),
        },
      ]);
      typingTimeouts.current.set(
        typingUserId,
        setTimeout(() => {
          setTypingUsers(previous =>
            previous.filter(item => item.userId !== typingUserId)
          );
          typingTimeouts.current.delete(typingUserId);
        }, 3_000)
      );
    });

    return () => {
      socket.emit("group:leave", { groupId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsSocketReady(false);
      for (const timeout of typingTimeouts.current.values()) {
        clearTimeout(timeout);
      }
      typingTimeouts.current.clear();
      if (ownTypingTimeout.current) {
        clearTimeout(ownTypingTimeout.current);
        ownTypingTimeout.current = null;
      }
    };
  }, [groupId, groupQuery.error, navigate, user, utils, validGroupId]);

  useEffect(() => {
    if (!groupQuery.data) return;
    setSettingsName(groupQuery.data.name);
    setSettingsDescription(groupQuery.data.description ?? "");
  }, [groupQuery.data]);

  useLayoutEffect(() => {
    const feed = messageFeedRef.current;
    if (!feed) return;
    if (!feedPositionedRef.current || feedPinnedToBottomRef.current) {
      feed.scrollTop = feed.scrollHeight;
      feedPositionedRef.current = true;
    }
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const picker = emojiPickerRef.current;
      if (picker && !picker.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [emojiPickerOpen]);

  const latestMessageId = messages.at(-1)?.id;
  useEffect(() => {
    if (!latestMessageId || !user) return;
    markRead.mutate({ groupId, messageId: latestMessageId });
  }, [groupId, latestMessageId, user]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionRange) return [];
    const query = mentionRange.query.toLowerCase();
    return members
      .filter(
        member =>
          member.userId !== user?.id &&
          (member.handle.toLowerCase().includes(query) ||
            member.displayName.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [members, mentionRange, user?.id]);

  const inviteCandidates = useMemo(() => {
    const memberIds = new Set(members.map(member => member.userId));
    return (friendsQuery.data ?? []).filter(
      friend => !memberIds.has(friend.id)
    );
  }, [friendsQuery.data, members]);

  if (loading || (!user && !isAnonymous)) return null;

  if (
    groupQuery.isLoading ||
    membersQuery.isLoading ||
    messagesQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <Loader2
          className="h-9 w-9 animate-spin text-purple-300"
          aria-label="Loading group"
        />
      </div>
    );
  }

  if (groupQuery.error || !groupQuery.data) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 text-white">
        <Card className="w-full max-w-md border-rose-400/20 bg-slate-900 p-7 text-center">
          <h1 className="text-xl font-bold">Group unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">
            You may no longer be a member, or this room does not exist.
          </p>
          <Button
            type="button"
            onClick={() => navigate("/groups")}
            className="mt-5 min-h-11 w-full bg-purple-600 text-white"
          >
            Back to groups
          </Button>
        </Card>
      </main>
    );
  }

  const group = groupQuery.data;

  const focusComposerWithoutPageJump = (cursor?: number) => {
    const pageLeft = window.scrollX;
    const pageTop = window.scrollY;
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      const targetCursor = cursor ?? input.value.length;
      input.setSelectionRange(targetCursor, targetCursor);
      window.scrollTo({ left: pageLeft, top: pageTop, behavior: "instant" });
      requestAnimationFrame(() => {
        window.scrollTo({ left: pageLeft, top: pageTop, behavior: "instant" });
      });
    });
  };

  const tagMember = (member: GroupMember) => {
    const tag = `${member.handle} `;
    setMessageInput(current => {
      const separator = current && !/\s$/.test(current) ? " " : "";
      return `${current}${separator}${tag}`;
    });
    setMentionRange(null);
    focusComposerWithoutPageJump();
  };

  const selectMention = (member: GroupMember) => {
    if (!mentionRange) return;
    const insertion = insertMentionAtRange(
      messageInput,
      mentionRange,
      member.handle
    );
    setMessageInput(insertion.text);
    setMentionRange(null);
    focusComposerWithoutPageJump(insertion.cursor);
  };

  const handleEmojiClick = (emoji: string) => {
    if (!inputRef.current) {
      setMessageInput(prev => prev + emoji);
      setEmojiPickerOpen(false);
      return;
    }
    const start = inputRef.current.selectionStart || messageInput.length;
    const end = inputRef.current.selectionEnd || messageInput.length;
    const newValue =
      messageInput.substring(0, start) + emoji + messageInput.substring(end);
    setMessageInput(newValue);
    setEmojiPickerOpen(false);
    focusComposerWithoutPageJump(start + emoji.length);
  };

  const sendGif = (gif: GifAsset) => {
    if (!socketRef.current || !isSocketReady) {
      toast.error("Live group connection is not ready");
      return;
    }
    feedPinnedToBottomRef.current = true;
    socketRef.current.emit(
      "group:send-message",
      {
        groupId,
        content: gif.title || "Shared a GIF",
        messageType: "image",
        mediaUrl: gif.shareUrl,
      },
      (response: { ok: boolean; message?: string }) => {
        if (!response?.ok) {
          toast.error(response?.message || "The GIF could not be posted");
          return;
        }
        toast.success("GIF posted");
      }
    );
    setEmojiPickerOpen(false);
  };

  const handleInputChange = (value: string, cursor: number) => {
    setMessageInput(value);
    setMentionRange(getMentionRange(value, cursor));
    socketRef.current?.emit("group:typing", {
      groupId,
      isTyping: true,
    });
    if (ownTypingTimeout.current) clearTimeout(ownTypingTimeout.current);
    ownTypingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("group:typing", {
        groupId,
        isTyping: false,
      });
    }, 1_200);
  };

  const sendMessage = (event?: React.FormEvent) => {
    event?.preventDefault();
    let content = messageInput.trim();
    if (!content || !isSocketReady) return;

    if (replyToMessage) {
      const cleanReplyContent = replyToMessage.content
        .replace(/^> @?.*?\n+/g, "")
        .slice(0, 100)
        .replace(/\n/g, " ");
      content = `> ${replyToMessage.senderHandle}: ${cleanReplyContent}\n${content}`;
    }

    feedPinnedToBottomRef.current = true;

    const mentions = members
      .filter(
        member =>
          user?.id &&
          member.userId !== user.id &&
          contentMentionsHandle(content, member.handle)
      )
      .map(member => member.userId);
    socketRef.current?.emit(
      "group:send-message",
      {
        groupId,
        content,
        mentions,
      },
      (response: { ok: boolean; message?: string }) => {
        if (response?.ok) {
          setMessageInput("");
          setMentionRange(null);
          setReplyToMessage(null);
          playSound("send");
        } else {
          toast.error(response?.message || "The message could not be sent");
        }
      }
    );
    socketRef.current?.emit("group:typing", {
      groupId,
      isTyping: false,
    });
  };

  const inviteSelectedFriend = async () => {
    const selectedId = Number(inviteUserId);
    if (!Number.isInteger(selectedId) || selectedId < 1) return;
    try {
      await inviteMember.mutateAsync({ groupId, userId: selectedId });
      setInviteUserId("");
      toast.success("Invitation sent");
    } catch {
      // Mutation error is already shown.
    }
  };

  const removeSelectedMember = async (member: GroupMember) => {
    try {
      await removeMember.mutateAsync({
        groupId,
        userId: member.userId,
      });
      await Promise.all([
        utils.groups.getMembers.invalidate({ groupId }),
        utils.groups.getById.invalidate({ groupId }),
        utils.groups.list.invalidate(),
      ]);
      toast.success(`${member.displayName} was removed`);
    } catch {
      // Mutation error is already shown.
    }
  };

  const updateSelectedMemberRole = async (
    member: GroupMember,
    role: "co_admin" | "moderator" | "member"
  ) => {
    try {
      await setMemberRole.mutateAsync({ groupId, userId: member.userId, role });
      await utils.groups.getMembers.invalidate({ groupId });
      toast.success(`${member.displayName} is now ${role.replace("_", " ")}`);
    } catch {
      // Mutation error is already shown.
    }
  };

  const enforceBan = async () => {
    if (!moderationTarget || banReason.trim().length < 2) return;
    try {
      const hours = Math.max(1, Number(banHours) || 24);
      await banMember.mutateAsync({
        groupId,
        userId: moderationTarget.userId,
        banType,
        durationMinutes: banType === "temporary" ? hours * 60 : undefined,
        reason: banReason.trim(),
      });
      await Promise.all([
        utils.groups.getMembers.invalidate({ groupId }),
        utils.groups.getById.invalidate({ groupId }),
        utils.groups.list.invalidate(),
      ]);
      toast.success(
        `${moderationTarget.displayName} was ${banType === "temporary" ? "temporarily" : "permanently"} banned`
      );
      setModerationTarget(null);
    } catch {
      // Mutation error is already shown.
    }
  };

  const saveGroupSettings = async () => {
    try {
      await updateGroup.mutateAsync({
        groupId,
        name: settingsName.trim(),
        description: settingsDescription.trim(),
      });
      await Promise.all([
        utils.groups.getById.invalidate({ groupId }),
        utils.groups.list.invalidate(),
      ]);
      toast.success("Group settings updated");
    } catch {
      // Mutation error is already shown.
    }
  };

  const restoreMemberAccess = async (userId: number) => {
    try {
      await unbanMember.mutateAsync({ groupId, userId });
      await bansQuery.refetch();
      toast.success("Group access restored");
    } catch {
      // Mutation error is already shown.
    }
  };

  const toggleReaction = (messageId: number, emoji: string) => {
    socketRef.current?.emit("group:toggle-reaction", {
      messageId,
      groupId,
      emoji,
    });
  };

  const sendVoiceNote = async (
    audioBlob: Blob,
    durationSeconds: number,
    clientRequestId: string,
    onUploadProgress: (percentage: number) => void
  ) => {
    const socket = socketRef.current;
    if (!socket || !isSocketReady) {
      throw new Error("Live group connection is not ready");
    }

    let mediaUrl = voiceUploadUrlsRef.current.get(clientRequestId);
    if (!mediaUrl) {
      mediaUrl = await uploadGroupVoiceNote(
        audioBlob,
        groupId,
        clientRequestId,
        onUploadProgress
      );
      voiceUploadUrlsRef.current.set(clientRequestId, mediaUrl);
    } else {
      onUploadProgress(100);
    }

    feedPinnedToBottomRef.current = true;
    await new Promise<void>((resolve, reject) => {
      socket.timeout(12_000).emit(
        "group:send-message",
        {
          groupId,
          content: `Voice note (${durationSeconds}s)`,
          messageType: "audio",
          mediaUrl,
          clientRequestId,
        },
        (error: Error | null, response: { ok: boolean; message?: string }) => {
          if (error || !response?.ok) {
            reject(
              error ??
                new Error(response?.message || "Voice note could not be posted")
            );
            return;
          }
          resolve();
        }
      );
    });
    voiceUploadUrlsRef.current.delete(clientRequestId);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Group link copied to clipboard!");
  };

  const leaveCurrentGroup = async () => {
    try {
      await leaveGroup.mutateAsync({ groupId });
      await utils.groups.list.invalidate();
      navigate("/groups");
    } catch {
      // Mutation error is already shown.
    }
  };

  const startGroupCall = (callType: "audio" | "video") => {
    if (!canStartCall) {
      toast.error("Only group staff can start conference calls");
      return;
    }
    if (!socketRef.current || !isSocketReady) {
      toast.error("Live group connection is not ready");
      return;
    }
    socketRef.current.emit(
      "group-call:start",
      { groupId, callType },
      (response: {
        ok: boolean;
        message?: string;
        call?: { id: number; groupId: number };
      }) => {
        if (!response?.ok || !response.call) {
          toast.error(response?.message || "Unable to start the group call");
          return;
        }
        navigate(`/groups/${groupId}/calls/${response.call.id}`);
      }
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be 15MB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl || !socketRef.current || !isSocketReady) {
        toast.error("Live group connection is not ready");
        return;
      }

      let messageType: "image" | "video" | "audio" | "file" = "file";
      if (file.type.startsWith("image/")) messageType = "image";
      else if (file.type.startsWith("video/")) messageType = "video";
      else if (file.type.startsWith("audio/")) messageType = "audio";

      socketRef.current.emit("group:send-message", {
        groupId,
        content: file.name,
        messageType,
        mediaUrl: dataUrl,
      });
      toast.success(`${file.name} shared!`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const renderContent = (message: GroupMessage) => {
    if (message.messageType === "audio" && message.mediaUrl) {
      return <AudioMessagePlayer src={message.mediaUrl} />;
    }
    if (message.messageType === "image" && message.mediaUrl) {
      return (
        <div className="my-2 max-w-md overflow-hidden rounded-xl border border-white/10 shadow-lg">
          <img
            src={message.mediaUrl}
            alt={message.content || "Shared image"}
            className="max-h-80 w-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }
    if (message.messageType === "video" && message.mediaUrl) {
      return (
        <div className="my-2 max-w-md overflow-hidden rounded-xl border border-white/10 shadow-lg">
          <video
            src={message.mediaUrl}
            controls
            className="max-h-80 w-full object-cover"
          />
        </div>
      );
    }

    const memberByHandle = new Map(
      members.map(member => [member.handle.toLowerCase(), member])
    );

    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    const parts = message.content.split(urlRegex);
    const mediaEmbeds: React.ReactNode[] = [];

    const formattedNodes = parts.map((part, index) => {
      if (part.match(/^https?:\/\//i)) {
        const url = part;

        const ytMatch = url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
        );
        if (ytMatch) {
          mediaEmbeds.push(
            <div
              key={`yt-${message.id}-${index}`}
              className="my-2 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-white/10 shadow-xl"
            >
              <iframe
                src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          );
        }

        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
        if (vimeoMatch) {
          mediaEmbeds.push(
            <div
              key={`vimeo-${message.id}-${index}`}
              className="my-2 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-white/10 shadow-xl"
            >
              <iframe
                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                title="Vimeo video player"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          );
        }

        if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
          mediaEmbeds.push(
            <div
              key={`img-${message.id}-${index}`}
              className="my-2 max-w-md overflow-hidden rounded-xl border border-white/10 shadow-lg"
            >
              <img
                src={url}
                alt="Shared media"
                className="max-h-80 w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        }

        if (url.match(/\.(mp4|webm|ogv|mov)(\?.*)?$/i)) {
          mediaEmbeds.push(
            <div
              key={`vid-${message.id}-${index}`}
              className="my-2 max-w-md overflow-hidden rounded-xl border border-white/10 shadow-lg"
            >
              <video
                src={url}
                controls
                className="max-h-80 w-full object-cover"
              />
            </div>
          );
        }

        if (url.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i)) {
          mediaEmbeds.push(
            <div key={`aud-${message.id}-${index}`} className="my-2 max-w-md">
              <AudioMessagePlayer src={url} />
            </div>
          );
        }

        return (
          <a
            key={`link-${message.id}-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-purple-300 underline hover:text-purple-200 break-all"
          >
            {url}
          </a>
        );
      }

      return part
        .split(
          /(:cyber-[a-z0-9-]+:|:(?:cute|sticker|clay|sticker-clay)-[a-z0-9-]+:|@?[A-Za-z0-9_-]+)/g
        )
        .map((subPart, subIndex) => {
          const cyberEmotion = cyberEmotionFromToken(subPart);
          if (cyberEmotion) {
            return (
              <CyberAnimeEmoticon
                key={`${message.id}-${index}-cyber-${subIndex}`}
                emotion={cyberEmotion}
                size="message"
              />
            );
          }
          const cuteSticker = cuteStickerSelectionFromToken(subPart);
          if (cuteSticker) {
            return (
              <CuteSticker
                key={`${message.id}-${index}-cute-${subIndex}`}
                sticker={cuteSticker.id}
                size="message"
                mode={cuteSticker.mode}
              />
            );
          }
          const clayMochi = clayMochiSelectionFromToken(subPart);
          if (clayMochi) {
            return (
              <ClayMochiEmoji
                key={`${message.id}-${index}-clay-${subIndex}`}
                sticker={clayMochi.id}
                size="message"
                mode={clayMochi.mode}
              />
            );
          }
          const normalizedHandle = subPart.startsWith("@")
            ? subPart.slice(1)
            : subPart;
          const member = memberByHandle.get(normalizedHandle.toLowerCase());
          if (!member || !message.mentions.includes(member.userId))
            return subPart;
          const isCurrentUser = user?.id ? member.userId === user.id : false;
          return (
            <span
              key={`${message.id}-${index}-${subIndex}`}
              className={
                isCurrentUser
                  ? "rounded bg-fuchsia-400/25 px-1 font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/40"
                  : "font-semibold text-purple-200"
              }
            >
              {subPart}
            </span>
          );
        });
    });

    return (
      <div className="mt-1">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
          {formattedNodes}
        </p>
        {mediaEmbeds.length > 0 ? (
          <div className="mt-2 space-y-2">{mediaEmbeds}</div>
        ) : null}
      </div>
    );
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => navigate("/groups")}
              aria-label="Back to groups"
              className="shrink-0 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button
              type="button"
              onClick={() => setGroupInfoOpen(true)}
              title="Click to view group info"
              className="flex min-w-0 items-center gap-3 text-left hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 rounded-lg p-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 font-bold uppercase shadow-md">
                {group.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-bold text-white flex items-center gap-1.5">
                  {group.name}
                  <Info className="h-3.5 w-3.5 text-purple-300" />
                </h1>
                <p className="truncate text-xs text-slate-400">
                  {group.memberCount ?? members.length} members ·{" "}
                  {isSocketReady ? "Live" : "Connecting…"}
                </p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleMute}
              title={isMuted ? "Unmute Audio Sounds" : "Mute Audio Sounds"}
              className="h-10 w-10 border-white/15 bg-white/5 text-purple-300 hover:bg-white/10 hover:text-purple-200"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-slate-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setGroupInfoOpen(true)}
              aria-label="Open group information"
              title="Group information"
              className="h-10 w-10 border-white/15 bg-white/5 text-purple-300 hover:bg-white/10 hover:text-purple-200"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={copyRoomLink}
              title="Share Group Link"
              className="h-10 w-10 border-white/15 bg-white/5 text-purple-300 hover:bg-white/10 hover:text-purple-200"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setActiveUsersOpen(true)}
              aria-label={`View ${activeGroupMembers.length} active group users`}
              title="Active users"
              className="relative h-10 w-10 border-white/15 bg-white/5 text-purple-300 hover:bg-white/10 hover:text-purple-200"
            >
              <Users className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-700 px-1 text-[10px] font-bold leading-5 text-white">
                {activeGroupMembers.length}
              </span>
            </Button>
            {canStartCall ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => startGroupCall("audio")}
                  disabled={!isSocketReady || Boolean(activeCallQuery.data)}
                  aria-label="Start group audio call"
                  title={
                    activeCallQuery.data
                      ? "A group call is already active"
                      : "Start audio call"
                  }
                  className="h-10 w-10 border-white/15 bg-white/5 text-white"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => startGroupCall("video")}
                  disabled={!isSocketReady || Boolean(activeCallQuery.data)}
                  aria-label="Start group video call"
                  title={
                    activeCallQuery.data
                      ? "A group call is already active"
                      : "Start video call"
                  }
                  className="h-10 w-10 border-white/15 bg-white/5 text-white"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={leaveCurrentGroup}
              disabled={
                Boolean(user?.id && group.createdBy === user.id) ||
                leaveGroup.isPending
              }
              title={
                user?.id && group.createdBy === user.id
                  ? "The group creator cannot leave"
                  : "Leave group"
              }
              className="min-h-10 border-rose-300/20 bg-rose-500/10 px-3 text-rose-200 hover:bg-rose-500/20"
            >
              <LogOut className="mr-0 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 ${
          showManagementSidebar
            ? "lg:grid-cols-[minmax(0,1fr)_300px]"
            : "grid-cols-1"
        }`}
      >
        <section className="flex h-[calc(100dvh-6rem)] min-w-0 flex-col">
          {activeCallQuery.data ? (
            <Card className="mb-3 flex flex-wrap items-center justify-between gap-3 border-emerald-300/25 bg-emerald-500/10 p-3 sm:p-4">
              <div>
                <p className="font-semibold text-emerald-100">
                  Group {activeCallQuery.data.callType} call is live
                </p>
                <p className="text-xs text-emerald-200/70">
                  {activeCallQuery.data.participantCount} participating · up to{" "}
                  {activeCallQuery.data.maxParticipants}
                </p>
              </div>
              <Button
                type="button"
                onClick={() =>
                  navigate(
                    `/groups/${groupId}/calls/${activeCallQuery.data?.id}`
                  )
                }
                className="min-h-10 bg-emerald-500 text-white hover:bg-emerald-400"
              >
                Join call
              </Button>
            </Card>
          ) : null}
          <Card
            ref={messageFeedRef}
            role="log"
            aria-label="Group message feed"
            aria-live="polite"
            onScroll={event => {
              const feed = event.currentTarget;
              feedPinnedToBottomRef.current =
                feed.scrollHeight - feed.scrollTop - feed.clientHeight < 72;
            }}
            className="min-h-0 flex-1 overflow-y-auto border-white/10 bg-slate-900/65 p-3 sm:p-5"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-72 items-center justify-center text-center">
                <div>
                  <Users className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-3 font-semibold">Start the conversation</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Type a member name to tag them, or send a voice note!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => {
                  const sender = members.find(
                    member => member.userId === message.senderId
                  );
                  const mentionsCurrentUser = user?.id
                    ? message.mentions.includes(user.id)
                    : false;
                  const canDelete =
                    (user?.id && message.senderId === user.id) ||
                    Boolean(canModerate);

                  // Group reactions by emoji
                  const reactionCounts: Record<string, number> = {};
                  for (const r of message.reactions ?? []) {
                    reactionCounts[r.emoji] =
                      (reactionCounts[r.emoji] ?? 0) + 1;
                  }

                  return (
                    <article
                      key={message.id}
                      className={`group relative rounded-xl border p-3 transition sm:p-4 ${
                        mentionsCurrentUser
                          ? "border-fuchsia-300/35 bg-fuchsia-500/10"
                          : "border-white/5 bg-slate-800/55"
                      }`}
                    >
                      {/* Hover Emoji Reaction Picker Bar */}
                      <div className="absolute -top-3.5 right-4 hidden group-hover:flex items-center gap-1 rounded-full border border-purple-500/30 bg-slate-900 px-2 py-1 shadow-lg backdrop-blur z-20">
                        {REACTION_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(message.id, emoji)}
                            className="text-base hover:scale-125 transition-transform p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyToMessage(message);
                            focusComposerWithoutPageJump();
                          }}
                          title="Reply to message"
                          className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-100 hover:bg-white/10 px-2 py-0.5 rounded transition-colors ml-1 border-l border-white/10"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      </div>

                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            if (message.senderId > 0)
                              setSelectedProfileUserId(message.senderId);
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 hover:scale-105 transition-transform"
                          aria-label={`View ${message.senderDisplayName}'s profile`}
                          title="View profile"
                        >
                          {message.senderAvatar ? (
                            <img
                              src={message.senderAvatar}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            message.senderDisplayName.charAt(0)
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <button
                              type="button"
                              onMouseDown={event => event.preventDefault()}
                              onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (sender) tagMember(sender);
                              }}
                              className="font-semibold text-purple-200 hover:text-purple-100 hover:underline"
                              title="Tag this member in the message"
                            >
                              @{message.senderHandle}
                            </button>
                            <span className="text-xs text-slate-500">
                              {new Date(message.timestamp).toLocaleString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {message.isEdited ? (
                              <span className="text-xs text-slate-500">
                                edited
                              </span>
                            ) : null}
                          </div>

                          {renderContent(message)}

                          {/* Reaction Chips */}
                          {Object.keys(reactionCounts).length > 0 ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {Object.entries(reactionCounts).map(
                                ([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                      toggleReaction(message.id, emoji)
                                    }
                                    className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/60 transition-colors"
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-[10px] text-slate-300">
                                      {count}
                                    </span>
                                  </button>
                                )
                              )}
                            </div>
                          ) : null}
                        </div>
                        {canDelete ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              socketRef.current?.emit("group:delete-message", {
                                messageId: message.id,
                              })
                            }
                            aria-label="Delete message"
                            className="h-9 w-9 shrink-0 text-slate-500 opacity-100 hover:bg-rose-500/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
                {typingUsers.length > 0 ? (
                  <p className="px-2 text-xs text-purple-200">
                    {typingUsers.map(item => item.displayName).join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing…
                  </p>
                ) : null}
              </div>
            )}
          </Card>

          <div className="relative mt-3">
            {mentionRange && mentionSuggestions.length > 0 ? (
              <Card className="absolute bottom-full left-0 z-30 mb-2 max-h-64 w-full overflow-y-auto border-purple-300/20 bg-slate-900 p-1 shadow-2xl sm:max-w-sm">
                {mentionSuggestions.map(member => (
                  <button
                    key={member.userId}
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      selectMention(member);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-purple-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold">
                      {member.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        @{member.handle}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </Card>
            ) : null}

            {replyToMessage ? (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-purple-500/30 bg-slate-900/90 px-3 py-2 text-xs backdrop-blur shadow-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className="h-4 w-4 shrink-0 text-purple-300" />
                  <div className="min-w-0">
                    <span className="font-semibold text-purple-200">
                      Replying to @{replyToMessage.senderHandle}
                    </span>
                    <p className="truncate text-slate-400">
                      {replyToMessage.content.replace(/^> @?.*?\n+/g, "")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMessage(null)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  title="Cancel reply"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <form className="flex items-end gap-2" onSubmit={sendMessage}>
              <div ref={emojiPickerRef} className="relative">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setEmojiPickerOpen(prev => !prev)}
                  title="Open emoji picker"
                  className="h-11 w-11 border-white/15 bg-white/5 text-yellow-400 hover:bg-white/10 hover:text-yellow-300"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                {emojiPickerOpen ? (
                  <div className="absolute bottom-full left-0 z-50 mb-3">
                    <GroupMediaPicker
                      onEmojiSelect={handleEmojiClick}
                      onGifSelect={sendGif}
                    />
                  </div>
                ) : null}
              </div>
              <VoiceRecorder
                onSendAudio={sendVoiceNote}
                disabled={!isSocketReady}
              />
              <label
                title="Share picture, video, or audio file"
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-purple-300 transition hover:bg-white/10 hover:text-purple-200 ${
                  !isSocketReady ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Image className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="relative min-w-0 flex-1">
                <AtSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Textarea
                  ref={inputRef}
                  value={messageInput}
                  maxLength={2_000}
                  rows={1}
                  onChange={event =>
                    handleInputChange(
                      event.target.value,
                      event.target.selectionStart
                    )
                  }
                  onClick={event =>
                    setMentionRange(
                      getMentionRange(
                        event.currentTarget.value,
                        event.currentTarget.selectionStart
                      )
                    )
                  }
                  onKeyDown={event => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                    if (
                      event.key === "Tab" &&
                      mentionRange &&
                      mentionSuggestions[0]
                    ) {
                      event.preventDefault();
                      selectMention(mentionSuggestions[0]);
                    }
                    if (event.key === "Escape") {
                      setMentionRange(null);
                      setEmojiPickerOpen(false);
                    }
                  }}
                  placeholder={
                    isSocketReady
                      ? "Message the group · type a member name to tag"
                      : "Connecting to live chat…"
                  }
                  disabled={!isSocketReady}
                  aria-label="Group message"
                  className="max-h-36 min-h-12 resize-none border-white/10 bg-slate-800 py-3 pl-10 text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={!messageInput.trim() || !isSocketReady}
                aria-label="Send group message"
                className="h-12 w-12 shrink-0 bg-purple-600 p-0 text-white hover:bg-purple-500"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </section>

        {showManagementSidebar ? (
          <aside className="space-y-4">
            {canManageStaff ? (
              <Card className="border-white/10 bg-slate-900/65 p-5">
                <h2 className="font-bold">Invite a friend</h2>
                <div className="mt-3 space-y-2">
                  <select
                    value={inviteUserId}
                    onChange={event => setInviteUserId(event.target.value)}
                    aria-label="Friend to invite"
                    className="min-h-11 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    <option value="">Choose a friend</option>
                    {inviteCandidates.map(friend => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name || friend.username || `User ${friend.id}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={inviteSelectedFriend}
                    disabled={!inviteUserId || inviteMember.isPending}
                    className="min-h-11 w-full bg-purple-600 text-white"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {inviteMember.isPending ? "Sending…" : "Send invitation"}
                  </Button>
                </div>
              </Card>
            ) : null}

            {isCreator && bansQuery.data?.length ? (
              <Card className="border-red-900/50 bg-black p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <Ban className="h-4 w-4 text-red-400" />
                  Active bans ({bansQuery.data.length})
                </h2>
                <div className="mt-3 space-y-2">
                  {bansQuery.data.map(ban => (
                    <div
                      key={ban.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-red-950 bg-neutral-950 p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">
                          {ban.name || ban.username || `User ${ban.userId}`}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {ban.banType} · {ban.reason || "No reason"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => restoreMemberAccess(ban.userId)}
                        disabled={unbanMember.isPending}
                        className="h-8 border-red-900 bg-black text-xs text-red-200"
                      >
                        Unban
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </aside>
        ) : null}
      </div>

      <Dialog
        open={Boolean(moderationTarget)}
        onOpenChange={open => !open && setModerationTarget(null)}
      >
        <DialogContent className="max-w-md border-red-900/70 bg-black text-white">
          <DialogHeader>
            <DialogTitle>
              Enforce rules for {moderationTarget?.displayName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <label className="block text-sm text-slate-300">
              Ban type
              <select
                value={banType}
                onChange={event =>
                  setBanType(event.target.value as "temporary" | "permanent")
                }
                className="mt-1 min-h-11 w-full rounded-md border border-red-900/60 bg-neutral-950 px-3 text-white"
              >
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            </label>
            {banType === "temporary" ? (
              <label className="block text-sm text-slate-300">
                Duration in hours
                <input
                  type="number"
                  min={1}
                  max={8760}
                  value={banHours}
                  onChange={event => setBanHours(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-red-900/60 bg-neutral-950 px-3 text-white"
                />
              </label>
            ) : null}
            <label className="block text-sm text-slate-300">
              Reason
              <Textarea
                value={banReason}
                onChange={event => setBanReason(event.target.value)}
                maxLength={500}
                className="mt-1 min-h-24 border-red-900/60 bg-neutral-950 text-white"
              />
            </label>
            <p className="text-xs leading-5 text-slate-400">
              The member will be disconnected from this room and any active
              group call immediately.
            </p>
            <Button
              type="button"
              onClick={enforceBan}
              disabled={banMember.isPending || banReason.trim().length < 2}
              className="min-h-11 w-full bg-red-800 text-white hover:bg-red-700"
            >
              <Ban className="mr-2 h-4 w-4" />
              {banMember.isPending
                ? "Applying ban…"
                : `${banType === "temporary" ? "Temporarily" : "Permanently"} ban member`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={activeUsersOpen} onOpenChange={setActiveUsersOpen}>
        <SheetContent className="border-red-900/70 bg-black text-white">
          <SheetHeader className="border-b border-white/10">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-red-300" />
              Active users
            </SheetTitle>
            <SheetDescription>
              {activeGroupMembers.length} currently connected to {group.name}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-5">
            {activeGroupMembers.length > 0 ? (
              activeGroupMembers.map(activeMember => {
                const member = activeMember.userId
                  ? members.find(
                      candidate => candidate.userId === activeMember.userId
                    )
                  : undefined;
                const displayName =
                  member?.displayName ?? activeMember.displayName;
                return (
                  <div
                    key={activeMember.participantId}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-950 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (activeMember.userId && activeMember.userId > 0) {
                          setSelectedProfileUserId(activeMember.userId);
                          setActiveUsersOpen(false);
                        }
                      }}
                      disabled={!activeMember.userId}
                      aria-label={`View ${displayName}'s profile`}
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-900 font-bold uppercase disabled:cursor-default"
                    >
                      {member?.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0)
                      )}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black bg-red-500" />
                    </button>
                    <div className="min-w-0 flex-1">
                      {member ? (
                        <button
                          type="button"
                          onMouseDown={event => event.preventDefault()}
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            tagMember(member);
                            setActiveUsersOpen(false);
                          }}
                          className="block max-w-full truncate text-left text-sm font-semibold text-white hover:text-red-200 hover:underline"
                          title="Tag this member in the message"
                        >
                          @{member.handle}
                        </button>
                      ) : (
                        <p className="truncate text-sm font-semibold text-white">
                          {displayName}
                        </p>
                      )}
                      <p className="truncate text-xs capitalize text-slate-500">
                        {member?.role?.replace("_", " ") || "Guest participant"}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-300">
                      Live
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                No active members are connected right now.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Group Info Dialog */}
      <Dialog open={groupInfoOpen} onOpenChange={setGroupInfoOpen}>
        <DialogContent className="border-purple-500/20 bg-slate-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl font-bold uppercase shadow-lg">
                {group.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{group.name}</p>
                <p className="text-xs text-slate-400 font-normal">
                  {(group as any).isPrivate
                    ? "🔒 Password Protected Room"
                    : "🌐 Public Room"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                {isCreator ? "Group settings and rules" : "About"}
              </h4>
              {isCreator ? (
                <div className="mt-3 space-y-3">
                  <input
                    value={settingsName}
                    onChange={event => setSettingsName(event.target.value)}
                    maxLength={80}
                    aria-label="Group name"
                    className="min-h-11 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  />
                  <Textarea
                    value={settingsDescription}
                    onChange={event =>
                      setSettingsDescription(event.target.value)
                    }
                    maxLength={500}
                    aria-label="Group description and rules"
                    placeholder="Describe the group and its rules"
                    className="min-h-24 border-white/10 bg-slate-800 text-white"
                  />
                  <Button
                    type="button"
                    onClick={saveGroupSettings}
                    disabled={
                      settingsName.trim().length < 2 || updateGroup.isPending
                    }
                    className="min-h-10 w-full bg-red-800 text-white hover:bg-red-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateGroup.isPending
                      ? "Saving…"
                      : "Save settings & rules"}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Only the group creator can change these structural settings.
                  </p>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {group.description ||
                    "No description provided for this group."}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <div>
                <p className="text-xs text-slate-400">Total Members</p>
                <p className="text-lg font-bold text-white">{members.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Connection Status</p>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isSocketReady ? "Live Connected" : "Connecting…"}
                </p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Membership and role permissions are checked on every action.
            </p>

            <div>
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                Members ({members.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {members.map(m => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          if (m.userId > 0) setSelectedProfileUserId(m.userId);
                          setGroupInfoOpen(false);
                        }}
                        aria-label={`View ${m.displayName}'s profile`}
                        title="View profile"
                        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-500/20 text-xs font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          m.displayName.charAt(0)
                        )}
                      </button>
                      <button
                        type="button"
                        onMouseDown={event => event.preventDefault()}
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          tagMember(m);
                          setGroupInfoOpen(false);
                        }}
                        title="Tag this member in the message"
                        className="truncate text-sm font-medium text-purple-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        @{m.handle}
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 capitalize bg-white/5 px-2 py-0.5 rounded">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                onClick={() => {
                  copyRoomLink();
                }}
                className="flex-1 bg-purple-600 text-white hover:bg-purple-500"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Group Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog
        open={Boolean(selectedProfileUserId)}
        onOpenChange={open => !open && setSelectedProfileUserId(null)}
      >
        <DialogContent className="border-purple-500/20 bg-slate-900 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              User Profile
            </DialogTitle>
          </DialogHeader>
          {selectedUserProfileQuery.isLoading ? (
            <div className="flex min-h-36 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            </div>
          ) : selectedUserProfileQuery.data ? (
            <div className="text-center space-y-4 pt-2">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold uppercase shadow-xl border-2 border-purple-300">
                {selectedUserProfileQuery.data.avatar ? (
                  <img
                    src={selectedUserProfileQuery.data.avatar}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  selectedUserProfileQuery.data.name?.charAt(0) ||
                  selectedUserProfileQuery.data.username?.charAt(0) ||
                  "U"
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
                  {selectedUserProfileQuery.data.name ||
                    selectedUserProfileQuery.data.username}
                  {selectedUserProfileQuery.data.isVerified ? (
                    <ShieldCheck className="h-4 w-4 text-purple-400" />
                  ) : null}
                </h3>
                <p className="text-sm font-medium text-purple-300">
                  @
                  {selectedUserProfileQuery.data.username ||
                    `user${selectedUserProfileQuery.data.id}`}
                </p>
                {selectedUserProfileQuery.data.country ? (
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {selectedUserProfileQuery.data.country}
                  </p>
                ) : null}
              </div>

              {selectedUserProfileQuery.data.bio ? (
                <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl italic">
                  "{selectedUserProfileQuery.data.bio}"
                </p>
              ) : null}

              <div className="space-y-2 pt-2">
                {user?.id && user.id !== selectedUserProfileQuery.data.id ? (
                  <Button
                    type="button"
                    onClick={() => {
                      sendFriendRequest.mutate({
                        receiverId: selectedUserProfileQuery.data!.id,
                      });
                    }}
                    disabled={sendFriendRequest.isPending}
                    className="w-full bg-purple-600 text-white hover:bg-purple-500"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {sendFriendRequest.isPending
                      ? "Sending…"
                      : "Send Friend Request"}
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const member = members.find(
                      m => m.userId === selectedProfileUserId
                    );
                    if (member) tagMember(member);
                    setSelectedProfileUserId(null);
                  }}
                  className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <AtSign className="mr-2 h-4 w-4 text-purple-300" />
                  Tag in Chat
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold uppercase shadow-lg">
                G
              </div>
              <div>
                <p className="text-base font-bold text-white">Guest User</p>
                <p className="text-xs text-slate-400 mt-1">
                  This user is currently participating as a guest.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  const member = members.find(
                    m => m.userId === selectedProfileUserId
                  );
                  if (member) tagMember(member);
                  setSelectedProfileUserId(null);
                }}
                className="w-full bg-purple-600 text-white"
              >
                <AtSign className="mr-2 h-4 w-4" />
                Tag guest in Chat
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
