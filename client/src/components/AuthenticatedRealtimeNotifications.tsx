import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useLocation } from "wouter";

type GroupMention = {
  groupId: number;
  groupName: string;
  messageId: number;
  senderName: string;
  senderHandle: string;
  preview: string;
};

type GroupCallInvitation = {
  id: number;
  groupId: number;
  groupName: string;
  callType: "audio" | "video";
};

export default function AuthenticatedRealtimeNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) return;
    const socket = io(window.location.origin, {
      auth: { mode: "authenticated" },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      socket.emit("notification:subscribe");
    });
    socket.on("group:mention", (mention: GroupMention) => {
      if (!Number.isInteger(mention?.groupId)) return;
      toast(`@${mention.senderHandle} mentioned you`, {
        id: `group-mention-${mention.messageId}`,
        description: `${mention.groupName}: ${mention.preview}`,
        duration: 12_000,
        action: {
          label: "Open group",
          onClick: () => navigate(`/groups/${mention.groupId}`),
        },
      });
    });
    socket.on("group-call:invitation", (invitation: GroupCallInvitation) => {
      if (
        !Number.isInteger(invitation?.id) ||
        !Number.isInteger(invitation?.groupId)
      ) {
        return;
      }
      toast(`Live ${invitation.callType} call`, {
        id: `group-call-${invitation.id}`,
        description: `${invitation.groupName} started a group call`,
        duration: 15_000,
        action: {
          label: "Join call",
          onClick: () =>
            navigate(`/groups/${invitation.groupId}/calls/${invitation.id}`),
        },
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [navigate, user]);

  return null;
}
