import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getAnonymousSession } from "@/lib/anonymous-session";
import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type CallParticipant = {
  userId: number;
  username: string | null;
  name: string | null;
  avatar: string | null;
  handle: string;
  displayName: string;
};

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL?.trim();
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME?.trim() || undefined,
      credential: import.meta.env.VITE_TURN_CREDENTIAL?.trim() || undefined,
    });
  }
  return servers;
}

function playCallChime(type: "join" | "leave") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(type === "join" ? 587.33 : 440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === "join" ? 880 : 293.66, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Web Audio blocked
  }
}

export default function GroupCall() {
  const [, params] = useRoute("/groups/:groupId/calls/:callId");
  const groupId = Number(params?.groupId);
  const callId = Number(params?.callId);
  const validIds =
    Number.isInteger(groupId) &&
    groupId > 0 &&
    Number.isInteger(callId) &&
    callId > 0;
  const { user, loading } = useAuth();
  const isAnonymous = Boolean(getAnonymousSession());
  const canAccessCall = Boolean(user) || isAnonymous;
  const [, navigate] = useLocation();

  const callQuery = trpc.groups.getCall.useQuery(
    { callId },
    { enabled: canAccessCall && validIds, retry: false }
  );

  const [socketConnected, setSocketConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [activeSpeakerId, setActiveSpeakerId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const peersRef = useRef(new Map<number, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<number, RTCIceCandidateInit[]>());
  const joinRequestedRef = useRef(false);
  const joinThroughSocketRef = useRef<(() => Promise<void>) | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const call = callQuery.data?.call;
  const callType = call?.callType;

  useEffect(() => {
    if (!validIds) {
      navigate("/groups", { replace: true });
      return;
    }
    if (!loading && !user && !isAnonymous) navigate("/guest-login", { replace: true });
  }, [isAnonymous, loading, navigate, user, validIds]);

  useEffect(() => {
    if (callQuery.data?.participants) {
      setParticipants(callQuery.data.participants as CallParticipant[]);
    }
  }, [callQuery.data?.participants]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [joined, localStream]);

  useEffect(() => {
    if (!joined || Object.keys(remoteStreams).length === 0) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const analysers: Array<{ userId: number; analyser: AnalyserNode }> = [];

      for (const [idStr, stream] of Object.entries(remoteStreams)) {
        if (stream.getAudioTracks().length > 0) {
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analysers.push({ userId: Number(idStr), analyser });
        }
      }

      const interval = setInterval(() => {
        let maxVolume = 0;
        let loudestSpeaker: number | null = null;
        for (const { userId, analyser } of analysers) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          if (avg > 15 && avg > maxVolume) {
            maxVolume = avg;
            loudestSpeaker = userId;
          }
        }
        setActiveSpeakerId(loudestSpeaker);
      }, 250);

      return () => {
        clearInterval(interval);
        audioCtx.close().catch(() => {});
      };
    } catch {
      // AudioContext unhandled
    }
  }, [joined, remoteStreams]);

  useEffect(() => {
    if (!joined || !call) return;
    const startedAt = new Date(call.startedAt).getTime();
    const update = () =>
      setDuration(Math.max(0, Math.floor((Date.now() - startedAt) / 1_000)));
    update();
    const timer = setInterval(update, 1_000);
    return () => clearInterval(timer);
  }, [call, joined]);

  useEffect(() => {
    if (!canAccessCall || !call || call.endedAt || call.groupId !== groupId) return;
    const socket = io(window.location.origin, {
      auth: { mode: user ? "authenticated" : "anonymous" },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 8,
    });
    socketRef.current = socket;

    const closePeer = (targetUserId: number) => {
      peersRef.current.get(targetUserId)?.close();
      peersRef.current.delete(targetUserId);
      pendingIceRef.current.delete(targetUserId);
      setRemoteStreams(current => {
        const next = { ...current };
        delete next[targetUserId];
        return next;
      });
    };

    const closeAllPeers = () => {
      for (const peer of peersRef.current.values()) peer.close();
      peersRef.current.clear();
      pendingIceRef.current.clear();
      setRemoteStreams({});
    };

    const flushPendingIce = async (
      targetUserId: number,
      peer: RTCPeerConnection
    ) => {
      const candidates = pendingIceRef.current.get(targetUserId) ?? [];
      pendingIceRef.current.delete(targetUserId);
      for (const candidate of candidates) {
        await peer.addIceCandidate(candidate);
      }
    };

    const ensurePeer = async (targetUserId: number) => {
      const current = peersRef.current.get(targetUserId);
      if (
        current &&
        current.signalingState !== "closed" &&
        current.connectionState !== "failed"
      ) {
        return current;
      }
      if (current) closePeer(targetUserId);
      const stream = localStreamRef.current;
      if (!stream) throw new Error("Local media is not ready");

      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      peer.onicecandidate = event => {
        if (!event.candidate) return;
        socket.emit("group-call:ice-candidate", {
          callId,
          targetUserId,
          candidate: event.candidate.toJSON(),
        });
      };
      peer.ontrack = event => {
        const incoming = event.streams[0];
        if (!incoming) return;
        setRemoteStreams(currentStreams => ({
          ...currentStreams,
          [targetUserId]: incoming,
        }));
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          toast.error("A participant's media connection failed");
        }
        if (peer.connectionState === "closed") closePeer(targetUserId);
      };
      peersRef.current.set(targetUserId, peer);
      return peer;
    };

    const joinThroughSocket = () =>
      new Promise<void>((resolve, reject) => {
        if (!socket.connected || !localStreamRef.current) {
          reject(new Error("Live connection or media is not ready"));
          return;
        }
        socket.emit(
          "group-call:join",
          { callId },
          async (response: {
            ok: boolean;
            message?: string;
            participants?: CallParticipant[];
          }) => {
            if (!response?.ok) {
              reject(new Error(response?.message || "Unable to join call"));
              return;
            }
            const activeParticipants = response.participants ?? [];
            setParticipants(activeParticipants);
            setJoined(true);
            try {
              for (const participant of activeParticipants) {
                if (participant.userId === user?.id) continue;
                const peer = await ensurePeer(participant.userId);
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit("group-call:offer", {
                  callId,
                  targetUserId: participant.userId,
                  offer: peer.localDescription,
                });
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    joinThroughSocketRef.current = joinThroughSocket;

    socket.on("connect", () => {
      setSocketConnected(true);
      if (joinRequestedRef.current && localStreamRef.current) {
        void joinThroughSocket().catch(error => {
          toast.error(error.message || "Unable to rejoin the call");
        });
      }
    });
    socket.on("disconnect", () => {
      setSocketConnected(false);
      setJoined(false);
      closeAllPeers();
    });
    socket.on("connect_error", () => {
      setSocketConnected(false);
      toast.error("Unable to connect to the live group call");
    });
    socket.on(
      "group-call:user-joined",
      (data: { callId: number; participant: CallParticipant }) => {
        if (Number(data?.callId) !== callId || !data.participant) return;
        playCallChime("join");
        setParticipants(current => [
          ...current.filter(
            participant => participant.userId !== data.participant.userId
          ),
          data.participant,
        ]);
      }
    );
    socket.on(
      "group-call:user-left",
      (data: { callId: number; userId: number }) => {
        if (Number(data?.callId) !== callId) return;
        playCallChime("leave");
        const departingUserId = Number(data.userId);
        closePeer(departingUserId);
        setParticipants(current =>
          current.filter(participant => participant.userId !== departingUserId)
        );
      }
    );
    socket.on(
      "group-call:offer",
      async (data: {
        callId: number;
        fromUserId: number;
        offer: RTCSessionDescriptionInit;
      }) => {
        if (Number(data?.callId) !== callId || !data.offer) return;
        try {
          const fromUserId = Number(data.fromUserId);
          const peer = await ensurePeer(fromUserId);
          await peer.setRemoteDescription(data.offer);
          await flushPendingIce(fromUserId, peer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("group-call:answer", {
            callId,
            targetUserId: fromUserId,
            answer: peer.localDescription,
          });
        } catch (error) {
          console.error("[GroupCall] Failed to answer an offer", error);
        }
      }
    );
    socket.on(
      "group-call:answer",
      async (data: {
        callId: number;
        fromUserId: number;
        answer: RTCSessionDescriptionInit;
      }) => {
        if (Number(data?.callId) !== callId || !data.answer) return;
        try {
          const fromUserId = Number(data.fromUserId);
          const peer = peersRef.current.get(fromUserId);
          if (!peer) return;
          await peer.setRemoteDescription(data.answer);
          await flushPendingIce(fromUserId, peer);
        } catch (error) {
          console.error("[GroupCall] Failed to apply an answer", error);
        }
      }
    );
    socket.on(
      "group-call:ice-candidate",
      async (data: {
        callId: number;
        fromUserId: number;
        candidate: RTCIceCandidateInit;
      }) => {
        if (Number(data?.callId) !== callId || !data.candidate) return;
        const fromUserId = Number(data.fromUserId);
        const peer = peersRef.current.get(fromUserId);
        if (!peer?.remoteDescription) {
          const pending = pendingIceRef.current.get(fromUserId) ?? [];
          pending.push(data.candidate);
          pendingIceRef.current.set(fromUserId, pending);
          return;
        }
        try {
          await peer.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("[GroupCall] Failed to add an ICE candidate", error);
        }
      }
    );
    socket.on("group-call:ended", (data: { callId: number }) => {
      if (Number(data?.callId) !== callId) return;
      toast.info("The group call ended");
      joinRequestedRef.current = false;
      closeAllPeers();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      navigate(`/groups/${groupId}`);
    });
    socket.on("group:access-revoked", data => {
      if (Number(data?.groupId) !== groupId) return;
      toast.error(data?.message || "Your access to this group was revoked");
      navigate("/groups", { replace: true });
    });

    return () => {
      joinThroughSocketRef.current = null;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      closeAllPeers();
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    };
  }, [call, callId, groupId, navigate, user]);

  if (loading || (!user && !isAnonymous)) return null;

  if (callQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-9 w-9 animate-spin text-purple-300" />
      </div>
    );
  }

  if (callQuery.error || !call || call.groupId !== groupId || call.endedAt) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 text-white">
        <Card className="w-full max-w-md border-white/10 bg-slate-900 p-7 text-center">
          <h1 className="text-xl font-bold">Group call unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">
            This call ended, does not exist, or is outside your group.
          </p>
          <Button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="mt-5 min-h-11 w-full bg-purple-600 text-white"
          >
            Back to the group
          </Button>
        </Card>
      </main>
    );
  }

  const stopLocalMedia = () => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsScreenSharing(false);
  };

  const joinCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera and microphone access is unavailable");
      return;
    }
    setJoining(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          callType === "video"
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicOn(true);
      setIsCameraOn(callType === "video");
      joinRequestedRef.current = true;
      await joinThroughSocketRef.current?.();
    } catch (error) {
      joinRequestedRef.current = false;
      stopLocalMedia();
      toast.error(
        error instanceof Error
          ? error.message
          : "Allow camera and microphone access to join"
      );
    } finally {
      setJoining(false);
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    localStreamRef.current
      ?.getAudioTracks()
      .forEach(track => (track.enabled = next));
    setIsMicOn(next);
  };

  const toggleCamera = () => {
    const next = !isCameraOn;
    localStreamRef.current
      ?.getVideoTracks()
      .forEach(track => (track.enabled = next));
    setIsCameraOn(next);
  };

  const shareScreen = async () => {
    if (callType !== "video") return;
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current?.stop();
      screenTrackRef.current = screenTrack;
      for (const peer of peersRef.current.values()) {
        const sender = peer
          .getSenders()
          .find(candidate => candidate.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);
      }
      setIsScreenSharing(true);
      screenTrack.onended = async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        for (const peer of peersRef.current.values()) {
          const sender = peer
            .getSenders()
            .find(candidate => candidate.track?.kind === "video");
          if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
        }
        screenTrackRef.current = null;
        setIsScreenSharing(false);
      };
    } catch {
      // The browser explains a cancelled screen-share prompt.
    }
  };

  const leaveCall = () => {
    joinRequestedRef.current = false;
    socketRef.current?.emit("group-call:leave", { callId });
    stopLocalMedia();
    navigate(`/groups/${groupId}`);
  };

  const endCall = () => {
    socketRef.current?.emit(
      "group-call:end",
      { callId },
      (response: { ok: boolean; message?: string }) => {
        if (!response?.ok) {
          toast.error(response?.message || "Unable to end the call");
        }
      }
    );
  };

  const formattedDuration = `${Math.floor(duration / 60)
    .toString()
    .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;
  const otherParticipants = participants.filter(
    participant => participant.userId !== (user?.id ?? 0)
  );

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-bold">{call.groupName}</h1>
            <p className="text-xs text-slate-400">
              Group {callType} call · {formattedDuration}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="min-h-10 border-white/15 bg-white/5 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Group
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {!joined ? (
          <div className="flex min-h-[70dvh] items-center justify-center">
            <Card className="w-full max-w-md border-white/10 bg-slate-900/75 p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15">
                {callType === "video" ? (
                  <Video className="h-8 w-8 text-purple-300" />
                ) : (
                  <Mic className="h-8 w-8 text-purple-300" />
                )}
              </div>
              <h2 className="mt-5 text-2xl font-bold">
                Join the group {callType} call
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Up to {call.maxParticipants} group members can join. Your
                browser will ask for media permission.
              </p>
              <Button
                type="button"
                onClick={joinCall}
                disabled={!socketConnected || joining}
                className="mt-6 min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white"
              >
                {joining ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                {joining ? "Joining…" : "Join call"}
              </Button>
            </Card>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-3 ${
                otherParticipants.length < 2
                  ? "md:grid-cols-2"
                  : "sm:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              <Card className="relative flex min-h-56 items-center justify-center overflow-hidden border-purple-300/25 bg-slate-900">
                {callType === "video" && isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-video h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold">
                      {(user?.name || user?.username || "Guest").charAt(0)}
                    </div>
                    <p className="mt-3 font-semibold">You</p>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">
                  You {isScreenSharing ? "· sharing screen" : ""}
                </span>
              </Card>

              {otherParticipants.map(participant => {
                const stream = remoteStreams[participant.userId];
                const isSpeaking = activeSpeakerId === participant.userId;
                return (
                  <Card
                    key={participant.userId}
                    className={`relative flex min-h-56 items-center justify-center overflow-hidden transition-all duration-300 ${
                      isSpeaking
                        ? "border-red-400 ring-2 ring-red-500/50 shadow-[0_0_25px_rgba(178,34,34,0.5)] bg-red-950/40"
                        : "border-white/10 bg-slate-900"
                    }`}
                  >
                    {callType === "video" && stream ? (
                      <video
                        ref={element => {
                          if (element) element.srcObject = stream;
                        }}
                        autoPlay
                        playsInline
                        muted={!isSpeakerOn}
                        className="aspect-video h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div
                          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold transition-transform ${
                            isSpeaking
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg"
                              : "bg-purple-500/20"
                          }`}
                        >
                          {participant.displayName.charAt(0)}
                        </div>
                        <p className="mt-3 font-semibold">
                          {participant.displayName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isSpeaking ? "Speaking…" : stream ? "Connected" : "Connecting media…"}
                        </p>
                      </div>
                    )}
                    {callType === "audio" && stream ? (
                      <audio
                        ref={element => {
                          if (element) element.srcObject = stream;
                        }}
                        autoPlay
                        muted={!isSpeakerOn}
                        className="hidden"
                      />
                    ) : null}
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs">
                      {participant.displayName} {isSpeaking ? "🎤" : ""}
                    </span>
                  </Card>
                );
              })}
            </div>

            <div className="sticky bottom-4 z-30 mx-auto mt-5 flex w-fit flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl backdrop-blur">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={toggleMic}
                aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                className="h-11 w-11 border-white/15 bg-white/5 text-white"
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              {callType === "video" ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={toggleCamera}
                    aria-label={
                      isCameraOn ? "Turn camera off" : "Turn camera on"
                    }
                    className="h-11 w-11 border-white/15 bg-white/5 text-white"
                  >
                    {isCameraOn ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={shareScreen}
                    aria-label="Share screen"
                    className="h-11 w-11 border-white/15 bg-white/5 text-white"
                  >
                    <MonitorUp className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setIsSpeakerOn(value => !value)}
                aria-label={isSpeakerOn ? "Mute speakers" : "Unmute speakers"}
                className="h-11 w-11 border-white/15 bg-white/5 text-white"
              >
                {isSpeakerOn ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
              <Button
                type="button"
                onClick={leaveCall}
                className="min-h-11 bg-rose-600 text-white hover:bg-rose-500"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Leave
              </Button>
              {call.canEnd ? (
                <Button
                  type="button"
                  onClick={endCall}
                  variant="outline"
                  className="min-h-11 border-rose-300/30 bg-rose-500/10 text-rose-200"
                >
                  End for all
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
