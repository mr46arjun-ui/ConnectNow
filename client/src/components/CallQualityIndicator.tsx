import { useEffect, useState } from "react";
import { Signal, Wifi, WifiOff } from "lucide-react";

interface CallQualityIndicatorProps {
  peerConnection?: RTCPeerConnection;
  updateInterval?: number;
}

type QualityLevel = "excellent" | "good" | "fair" | "poor" | "offline";

export default function CallQualityIndicator({
  peerConnection,
  updateInterval = 2000,
}: CallQualityIndicatorProps) {
  const [quality, setQuality] = useState<QualityLevel>("offline");
  const [stats, setStats] = useState({
    bitrate: 0,
    packetLoss: 0,
    latency: 0,
  });

  useEffect(() => {
    if (!peerConnection) return;

    const checkQuality = async () => {
      try {
        const stats = await peerConnection.getStats();
        let inboundRtpStats: any = null;
        let candidatePair: any = null;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.mediaType === "video") {
            inboundRtpStats = report;
          }
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            candidatePair = report;
          }
        });

        if (inboundRtpStats && candidatePair) {
          const bitrate = Math.round(
            (inboundRtpStats.bytesReceived * 8) / (updateInterval / 1000)
          );
          const packetLoss = inboundRtpStats.packetsLost || 0;
          const latency = Math.round(candidatePair.currentRoundTripTime * 1000);

          setStats({ bitrate, packetLoss, latency });

          // Determine quality level
          let level: QualityLevel = "offline";
          if (bitrate > 2500) {
            level = "excellent";
          } else if (bitrate > 1500) {
            level = "good";
          } else if (bitrate > 500) {
            level = "fair";
          } else if (bitrate > 0) {
            level = "poor";
          }

          setQuality(level);
        }
      } catch (error) {
        console.error("Failed to get call quality stats:", error);
      }
    };

    const interval = setInterval(checkQuality, updateInterval);
    checkQuality(); // Initial check

    return () => clearInterval(interval);
  }, [peerConnection, updateInterval]);

  const getQualityColor = () => {
    switch (quality) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "fair":
        return "text-yellow-500";
      case "poor":
        return "text-orange-500";
      default:
        return "text-red-500";
    }
  };

  const getQualityLabel = () => {
    switch (quality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return "Offline";
    }
  };

  const getSignalBars = () => {
    switch (quality) {
      case "excellent":
        return 4;
      case "good":
        return 3;
      case "fair":
        return 2;
      case "poor":
        return 1;
      default:
        return 0;
    }
  };

  const bars = getSignalBars();

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
      {quality === "offline" ? (
        <WifiOff className="w-4 h-4 text-red-500" />
      ) : (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-sm transition-all ${
                bar <= bars
                  ? getQualityColor()
                  : "bg-slate-600"
              }`}
              style={{ height: `${bar * 4}px` }}
            />
          ))}
        </div>
      )}
      <span className={`text-xs font-medium ${getQualityColor()}`}>
        {getQualityLabel()}
      </span>
      {quality !== "offline" && (
        <div className="flex items-center gap-1 text-xs text-gray-400 ml-1">
          <span>{Math.round(stats.bitrate / 1000)}kbps</span>
          <span>•</span>
          <span>{stats.latency}ms</span>
        </div>
      )}
    </div>
  );
}
