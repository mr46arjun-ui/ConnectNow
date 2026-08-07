import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioMessagePlayerProps {
  src: string;
}

export function AudioMessagePlayer({ src }: AudioMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-purple-950/70 p-2.5 border border-purple-500/30 max-w-[280px] my-1 shadow-md backdrop-blur">
      <Button
        type="button"
        size="icon"
        onClick={togglePlay}
        className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shrink-0 shadow hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </Button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-purple-200">
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-purple-400" /> Voice Note
          </span>
          <span className="font-mono text-slate-300">
            {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress track */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
