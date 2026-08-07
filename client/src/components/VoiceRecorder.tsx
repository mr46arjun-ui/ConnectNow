import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type VoiceStage =
  | "idle"
  | "recording"
  | "encoding"
  | "ready"
  | "uploading"
  | "posted"
  | "error";

interface VoiceRecorderProps {
  onSendAudio: (
    audioBlob: Blob,
    durationSeconds: number,
    clientRequestId: string,
    onUploadProgress: (percentage: number) => void
  ) => Promise<void> | void;
  disabled?: boolean;
}

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/aac",
] as const;
const MAX_RECORDING_SECONDS = 120;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const MAX_UPLOAD_ATTEMPTS = 3;

function wait(delayMs: number) {
  return new Promise(resolve => window.setTimeout(resolve, delayMs));
}

export function VoiceRecorder({ onSendAudio, disabled }: VoiceRecorderProps) {
  const [stage, setStage] = useState<VoiceStage>("idle");
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadAttempt, setUploadAttempt] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const discardOnStopRef = useRef(false);
  const requestIdRef = useRef("");
  const previewUrlRef = useRef<string | null>(null);

  const clearTimer = () => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopMediaTracks = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
  };

  const resetRecorder = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setStage("idle");
    setRecordedAudio(null);
    setPreviewUrl(null);
    setDuration(0);
    setRecordingTime(0);
    setUploadAttempt(0);
    setUploadProgress(0);
    requestIdRef.current = "";
    chunksRef.current = [];
  };

  useEffect(() => {
    return () => {
      discardOnStopRef.current = true;
      clearTimer();
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      stopMediaTracks();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    clearTimer();
    setDuration(
      Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1_000))
    );
    setStage("encoding");
    recorder.requestData();
    recorder.stop();
  };

  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const mimeType = RECORDING_MIME_TYPES.find(type =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 48_000,
      });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      discardOnStopRef.current = false;
      requestIdRef.current = crypto.randomUUID();

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = event => {
        console.error("[VoiceRecorder] MediaRecorder error", event);
        clearTimer();
        stopMediaTracks();
        setStage("error");
        toast.error("Recording failed. Please try again.");
      };

      recorder.onstop = async () => {
        stopMediaTracks();
        if (discardOnStopRef.current) {
          discardOnStopRef.current = false;
          return;
        }

        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || mimeType || "audio/webm",
          });
          if (blob.size === 0) throw new Error("No audio was captured");
          if (blob.size > MAX_AUDIO_BYTES) {
            throw new Error(
              "The voice note is too large. Record a shorter message."
            );
          }
          const objectUrl = URL.createObjectURL(blob);
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = objectUrl;
          setRecordedAudio(blob);
          setPreviewUrl(objectUrl);
          setStage("ready");
        } catch (error) {
          console.error("[VoiceRecorder] Encoding failed", error);
          setStage("error");
          toast.error(
            error instanceof Error
              ? error.message
              : "The recording could not be encoded"
          );
        }
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecordingTime(0);
      setDuration(0);
      setRecordedAudio(null);
      setPreviewUrl(null);
      setStage("recording");
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1_000);
        setRecordingTime(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) stopRecording();
      }, 250);
    } catch (error) {
      console.error("Microphone access error:", error);
      stopMediaTracks();
      setStage("idle");
      toast.error(
        "Failed to access the microphone. Please allow microphone permission."
      );
    }
  };

  const cancelRecording = () => {
    discardOnStopRef.current = true;
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopMediaTracks();
    resetRecorder();
  };

  const handleSend = async () => {
    if (!recordedAudio) return;
    setStage("uploading");
    setUploadProgress(0);
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
      setUploadAttempt(attempt);
      try {
        await onSendAudio(
          recordedAudio,
          duration,
          requestIdRef.current,
          setUploadProgress
        );
        setStage("posted");
        toast.success("Voice note posted");
        await wait(700);
        resetRecorder();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_UPLOAD_ATTEMPTS) await wait(600 * 2 ** (attempt - 1));
      }
    }

    console.error("[VoiceRecorder] Upload failed", lastError);
    setStage("error");
    toast.error(
      lastError instanceof Error
        ? lastError.message
        : "Voice note upload failed. Please retry."
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (stage === "encoding") {
    return (
      <div
        className="flex min-h-11 items-center gap-2 rounded-xl border border-red-900/60 bg-black px-3 text-xs text-slate-300"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-red-300" />
        Encoding audio…
      </div>
    );
  }

  if (stage === "uploading" || stage === "posted") {
    return (
      <div
        className="flex min-h-11 items-center gap-2 rounded-xl border border-red-900/60 bg-black px-3 text-xs text-slate-200"
        aria-live="polite"
      >
        {stage === "posted" ? (
          <Check className="h-4 w-4 text-red-300" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-red-300" />
        )}
        {stage === "posted"
          ? "Posted"
          : `Uploading · ${uploadProgress}% · attempt ${uploadAttempt}/${MAX_UPLOAD_ATTEMPTS}`}
      </div>
    );
  }

  if (recordedAudio) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-black p-1.5"
        aria-live="polite"
      >
        <audio
          src={previewUrl ?? undefined}
          controls
          className="h-8 max-w-[150px] sm:max-w-[220px]"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={cancelRecording}
          className="h-8 w-8 text-red-300 hover:bg-red-950"
          title="Discard recording"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          className="h-8 bg-red-800 px-3 text-xs font-medium text-white hover:bg-red-700"
        >
          {stage === "error" ? (
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Send className="mr-1 h-3.5 w-3.5" />
          )}
          {stage === "error" ? "Retry" : "Send"}
        </Button>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={resetRecorder}
        className="h-9 w-9 rounded-xl text-red-300 hover:bg-red-950"
        title="Reset voice recorder"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    );
  }

  if (stage === "recording") {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/60 px-3 py-1.5"
        aria-live="polite"
      >
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
        <span className="font-mono text-xs font-bold text-red-200">
          {formatTime(recordingTime)}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={stopRecording}
          className="h-7 w-7 text-red-200 hover:bg-red-900"
          title="Stop and encode recording"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={cancelRecording}
          className="h-7 w-7 text-slate-400 hover:text-white"
          title="Cancel recording"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={startRecording}
      disabled={disabled}
      className="h-9 w-9 rounded-xl text-slate-400 hover:bg-red-950 hover:text-red-200"
      title="Record voice note"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
