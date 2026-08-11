import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  SkipForward,
  UserRound,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useLocation } from "wouter";

type MediaMode = "voice" | "video";
type ParticipantId = number | string;

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

export default function MediaChatExperience({ media }: { media: MediaMode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [partnerName, setPartnerName] = useState("Connected user");
  const [searchingCount, setSearchingCount] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(media === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<ParticipantId | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRef = useRef<HTMLMediaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const closePeer = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setRemoteStream(null);
  };

  const stopLocalMedia = () => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsScreenSharing(false);
  };

  const resetCall = (stopMedia: boolean) => {
    closePeer();
    stopTimer();
    if (stopMedia) stopLocalMedia();
    sessionIdRef.current = null;
    pendingIceRef.current = [];
    setIsCallActive(false);
    setCallDuration(0);
    setPartnerName("Connected user");
  };

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices are unavailable in this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video:
        media === "video"
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
    setIsCameraOn(media === "video");
    return stream;
  };

  const ensurePeer = async () => {
    if (peerRef.current && peerRef.current.signalingState !== "closed") {
      return peerRef.current;
    }

    const stream = await ensureLocalMedia();
    const peer = new RTCPeerConnection({ iceServers: getIceServers() });
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = event => {
      const incoming = event.streams[0];
      if (incoming) setRemoteStream(incoming);
    };
    peer.onicecandidate = event => {
      if (event.candidate && sessionIdRef.current !== null) {
        socketRef.current?.emit("webrtc:ice-candidate", {
          sessionId: sessionIdRef.current,
          candidate: event.candidate,
        });
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        toast.error("The media connection failed. Try another match.");
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const flushPendingIce = async (peer: RTCPeerConnection) => {
    const candidates = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of candidates) {
      await peer.addIceCandidate(candidate);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!user) return;

    const socket = io(window.location.origin, {
      auth: { mode: "authenticated" },
      transports: ["websocket", "polling"],
      timeout: 15_000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => {
      setSocketConnected(false);
      setIsSearching(false);
      resetCall(true);
    });
    socket.on("connect_error", () => {
      setSocketConnected(false);
      toast.error("Unable to connect to live chat");
    });
    socket.on("stats:matching-queue", data => {
      if (
        data?.context === "random_matching_queue" &&
        data?.matchingState === "SEARCHING"
      ) {
        setSearchingCount(Number(data?.counts?.[media]) || 0);
      }
    });
    socket.on("chat:waiting", () => setIsSearching(true));
    socket.on("chat:left-queue", () => setIsSearching(false));
    socket.on("chat:error", data => {
      setIsSearching(false);
      toast.error(data?.message || "Unable to start the call");
    });

    socket.on("chat:matched", async data => {
      try {
        sessionIdRef.current = data.sessionId;
        setPartnerName(data.matchedDisplayName || "Connected user");
        setIsSearching(false);
        setIsCallActive(true);
        setCallDuration(0);
        stopTimer();
        timerRef.current = setInterval(
          () => setCallDuration(value => value + 1),
          1_000
        );

        const peer = await ensurePeer();
        if (data.initiator) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            sessionId: data.sessionId,
            offer,
          });
        }
      } catch (error) {
        console.error("[MediaChat] Failed to begin matched call", error);
        toast.error("Camera or microphone access failed");
        socket.emit("chat:end", { sessionId: data.sessionId });
        resetCall(true);
      }
    });

    socket.on("webrtc:offer", async data => {
      try {
        sessionIdRef.current = data.sessionId;
        const peer = await ensurePeer();
        await peer.setRemoteDescription(data.offer);
        await flushPendingIce(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          sessionId: data.sessionId,
          answer,
        });
      } catch (error) {
        console.error("[MediaChat] Failed to answer offer", error);
        toast.error("Unable to establish the media connection");
      }
    });

    socket.on("webrtc:answer", async data => {
      try {
        const peer = peerRef.current;
        if (!peer) return;
        await peer.setRemoteDescription(data.answer);
        await flushPendingIce(peer);
      } catch (error) {
        console.error("[MediaChat] Failed to apply answer", error);
      }
    });

    socket.on("webrtc:ice-candidate", async data => {
      if (!data?.candidate) return;
      try {
        const peer = peerRef.current;
        if (!peer?.remoteDescription) {
          pendingIceRef.current.push(data.candidate);
          return;
        }
        await peer.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("[MediaChat] Failed to add ICE candidate", error);
      }
    });

    const partnerLeft = () => {
      resetCall(true);
      setIsSearching(false);
      toast.info("The other person left the call");
    };
    socket.on("call:ended", partnerLeft);
    socket.on("chat:partner-left", partnerLeft);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      resetCall(true);
    };
  }, [media, user]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isCallActive, localStream]);

  useEffect(() => {
    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = remoteStream;
    }
  }, [isCallActive, remoteStream]);

  const startSearch = async () => {
    try {
      await ensureLocalMedia();
      setIsSearching(true);
      socketRef.current?.emit("chat:join-queue", { sessionType: media });
    } catch {
      toast.error(
        `Allow ${media === "video" ? "camera and microphone" : "microphone"} access to continue`
      );
    }
  };

  const cancelSearch = () => {
    socketRef.current?.emit("chat:leave-queue");
    setIsSearching(false);
    stopLocalMedia();
  };

  const endCall = () => {
    if (sessionIdRef.current !== null) {
      socketRef.current?.emit("call:end", {
        sessionId: sessionIdRef.current,
        duration: callDuration,
      });
    }
    resetCall(true);
  };

  const skipCall = () => {
    closePeer();
    stopTimer();
    sessionIdRef.current = null;
    setIsCallActive(false);
    setCallDuration(0);
    setIsSearching(true);
    socketRef.current?.emit("chat:skip", { sessionType: media });
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
    if (media !== "video" || !peerRef.current) return;
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = display.getVideoTracks()[0];
      const sender = peerRef.current
        .getSenders()
        .find(candidate => candidate.track?.kind === "video");
      if (!sender || !screenTrack) {
        display.getTracks().forEach(track => track.stop());
        return;
      }
      screenTrackRef.current?.stop();
      screenTrackRef.current = screenTrack;
      await sender.replaceTrack(screenTrack);
      setIsScreenSharing(true);
      screenTrack.onended = async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack) await sender.replaceTrack(cameraTrack);
        screenTrackRef.current = null;
        setIsScreenSharing(false);
      };
    } catch {
      // The browser already explains a cancelled screen-share prompt.
    }
  };

  if (loading || !user) return null;

  const formattedDuration = `${Math.floor(callDuration / 60)
    .toString()
    .padStart(2, "0")}:${(callDuration % 60).toString().padStart(2, "0")}`;
  const title = media === "video" ? "Video chat" : "Voice chat";

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {media === "video" ? (
              <Video className="h-6 w-6 text-purple-300" />
            ) : (
              <Mic className="h-6 w-6 text-purple-300" />
            )}
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-slate-400">
                {socketConnected
                  ? `${searchingCount} searching`
                  : "Connecting…"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {!isCallActive ? (
          <div className="flex min-h-[68dvh] items-center justify-center">
            <Card className="w-full max-w-md border-white/10 bg-slate-900/70 p-6 text-center shadow-2xl sm:p-9">
              {isSearching ? (
                <>
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-300" />
                  <h1 className="mt-6 text-2xl font-bold">Finding a match…</h1>
                  <p className="mt-2 leading-6 text-slate-400">
                    Your{" "}
                    {media === "video"
                      ? "camera and microphone are"
                      : "microphone is"}{" "}
                    ready.
                  </p>
                  {media === "video" && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="mt-5 aspect-video w-full rounded-xl bg-black object-cover"
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelSearch}
                    className="mt-6 min-h-11 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel search
                  </Button>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15">
                    {media === "video" ? (
                      <Video className="h-8 w-8 text-purple-300" />
                    ) : (
                      <Mic className="h-8 w-8 text-purple-300" />
                    )}
                  </div>
                  <h1 className="mt-6 text-2xl font-bold">
                    Ready for {title.toLowerCase()}?
                  </h1>
                  <p className="mt-2 leading-6 text-slate-400">
                    Your browser will ask for{" "}
                    {media === "video" ? "camera and microphone" : "microphone"}{" "}
                    permission before matchmaking begins.
                  </p>
                  <Button
                    type="button"
                    onClick={startSearch}
                    disabled={!socketConnected}
                    className="mt-6 min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base font-semibold text-white hover:from-purple-500 hover:to-pink-500"
                  >
                    Start {title.toLowerCase()}
                  </Button>
                </>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              {media === "video" ? (
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                  <video
                    ref={remoteMediaRef as React.RefObject<HTMLVideoElement>}
                    autoPlay
                    playsInline
                    muted={!isSpeakerOn}
                    className="h-full w-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-3 right-3 aspect-video w-28 rounded-lg border border-white/20 bg-slate-900 object-cover shadow-xl sm:w-44"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-sm">
                    {partnerName}
                  </span>
                </div>
              ) : (
                <Card className="flex min-h-[55dvh] flex-col items-center justify-center border-white/10 bg-slate-900/65 p-8 text-center">
                  <audio
                    ref={remoteMediaRef as React.RefObject<HTMLAudioElement>}
                    autoPlay
                    muted={!isSpeakerOn}
                  />
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <UserRound className="h-12 w-12" />
                  </div>
                  <h1 className="mt-6 text-2xl font-bold">{partnerName}</h1>
                  <p className="mt-2 text-3xl font-semibold text-purple-300">
                    {formattedDuration}
                  </p>
                </Card>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="border-white/10 bg-slate-900/65 p-5">
                <p className="text-sm text-slate-400">Call duration</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formattedDuration}
                </p>
              </Card>

              <Card className="border-white/10 bg-slate-900/65 p-5">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={toggleMic}
                    variant="outline"
                    className="min-h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                    aria-label={
                      isMicOn ? "Mute microphone" : "Unmute microphone"
                    }
                  >
                    {isMicOn ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsSpeakerOn(value => !value)}
                    variant="outline"
                    className="min-h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                    aria-label={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
                  >
                    {isSpeakerOn ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </Button>
                  {media === "video" ? (
                    <>
                      <Button
                        type="button"
                        onClick={toggleCamera}
                        variant="outline"
                        className="min-h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                        aria-label={
                          isCameraOn ? "Turn camera off" : "Turn camera on"
                        }
                      >
                        {isCameraOn ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <VideoOff className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={shareScreen}
                        variant="outline"
                        className="min-h-12 border-white/15 bg-white/5 text-white hover:bg-white/10"
                        aria-label="Share screen"
                      >
                        <MonitorUp
                          className={`h-5 w-5 ${
                            isScreenSharing ? "text-purple-300" : ""
                          }`}
                        />
                      </Button>
                    </>
                  ) : null}
                </div>
              </Card>

              <Card className="border-white/10 bg-slate-900/65 p-5">
                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={skipCall}
                    className="min-h-11 bg-amber-600 text-white hover:bg-amber-500"
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip
                  </Button>
                  <Button
                    type="button"
                    onClick={endCall}
                    className="min-h-11 bg-rose-600 text-white hover:bg-rose-500"
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End call
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
