// Voice Note Recorder Component
// Records audio via MediaRecorder API, shows waveform animation

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Send, Trash2 } from "lucide-react";

interface Props {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(100);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      onCancel();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSend = () => {
    if (blob) onSend(blob, duration);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] rounded-2xl border border-white/10">
      {/* Waveform animation */}
      <div className="flex items-center gap-0.5 h-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-purple-500"
            animate={
              recording
                ? {
                    height: [4, Math.random() * 24 + 8, 4],
                  }
                : { height: 4 }
            }
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: recording ? Infinity : 0,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span
        className="text-sm font-mono text-white min-w-[40px]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {formatDuration(duration)}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {recording ? (
          <button
            onClick={stopRecording}
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
