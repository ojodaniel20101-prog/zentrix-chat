// Voice Note Player Component

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

interface Props {
  url: string;
  duration?: number;
  isSent: boolean;
}

export default function VoicePlayer({ url, duration = 0, isSent }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };

    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const trackColor = isSent ? "bg-blue-300/30" : "bg-white/20";
  const fillColor = isSent ? "bg-blue-200" : "bg-blue-400";

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
          isSent
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
        }`}
      >
        {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform bars */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-6">
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 4 + Math.sin(i * 0.8) * 8 + Math.cos(i * 1.2) * 6;
            const filled = (i / 30) * 100 <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors duration-100 ${
                  filled ? fillColor : trackColor
                }`}
                style={{ height: `${Math.max(4, h)}px` }}
              />
            );
          })}
        </div>
        <span
          className={`text-xs ${isSent ? "text-blue-200/70" : "text-slate-400"}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {playing ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
