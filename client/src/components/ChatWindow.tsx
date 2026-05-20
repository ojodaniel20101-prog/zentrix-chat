// Obsidian Flow Design — Chat Window
// Full-height message area with floating input bar, read receipts, media sharing

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import {
  Send,
  Mic,
  Paperclip,
  Image as ImageIcon,
  X,
  ChevronDown,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useMessages } from "@/hooks/useMessages";
import { useUserPresence, useMultipleUsers } from "@/hooks/useUserPresence";
import { sendMessage } from "@/lib/firestore";
import { uploadChatImage, uploadChatFile, uploadVoiceNote } from "@/lib/storage";
import { toast } from "sonner";
import MessageStatus from "./MessageStatus";
import VoiceRecorder from "./VoiceRecorder";
import VoicePlayer from "./VoicePlayer";
import type { Message, Chat } from "@/lib/firestore";
import { useDropzone } from "react-dropzone";

const formatMsgTime = (ts: unknown): string => {
  if (!ts) return "";
  const date = (ts as { toDate: () => Date }).toDate?.() || new Date(ts as string);
  return format(date, "HH:mm");
};

const formatDateSeparator = (ts: unknown): string => {
  if (!ts) return "";
  const date = (ts as { toDate: () => Date }).toDate?.() || new Date(ts as string);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

const shouldShowDateSeparator = (msg: Message, prev: Message | null): boolean => {
  if (!prev) return true;
  const d1 = (msg.timestamp as { toDate: () => Date })?.toDate?.();
  const d2 = (prev.timestamp as { toDate: () => Date })?.toDate?.();
  if (!d1 || !d2) return false;
  return d1.toDateString() !== d2.toDateString();
};

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  chatMembers: string[];
  currentUid: string;
  senderName?: string;
  senderPhoto?: string | null;
  isGroup: boolean;
}

const MessageBubble = ({
  message,
  isSent,
  chatMembers,
  currentUid,
  senderName,
  senderPhoto,
  isGroup,
}: MessageBubbleProps) => {
  if (message.deleted) {
    return (
      <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}>
        <span className="text-xs text-slate-500 italic px-3 py-1.5 bg-white/5 rounded-xl">
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1 group`}
    >
      {/* Avatar for received messages in groups */}
      {!isSent && isGroup && (
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-auto mb-1">
          {senderPhoto ? (
            <img src={senderPhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {senderName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[70%] ${isSent ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name in groups */}
        {!isSent && isGroup && senderName && (
          <span className="text-xs text-blue-400 mb-1 px-1 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {senderName}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isSent
              ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-sm"
              : "bg-[#1a1f2e] text-slate-100 border border-white/5 rounded-bl-sm"
          }`}
        >
          {/* Image */}
          {message.type === "image" && message.fileURL && (
            <div className="mb-2">
              <img
                src={message.fileURL}
                alt="Shared image"
                className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: 300 }}
                onClick={() => window.open(message.fileURL, "_blank")}
              />
            </div>
          )}

          {/* File */}
          {message.type === "file" && message.fileURL && (
            <a
              href={message.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-2 rounded-xl mb-2 transition-colors ${
                isSent ? "bg-white/10 hover:bg-white/20" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSent ? "bg-white/20" : "bg-blue-500/20"}`}>
                <FileText className={`w-5 h-5 ${isSent ? "text-white" : "text-blue-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {message.fileName || "File"}
                </p>
                {message.fileSize && (
                  <p className={`text-xs ${isSent ? "text-blue-200/70" : "text-slate-400"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {(message.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <Download className={`w-4 h-4 flex-shrink-0 ${isSent ? "text-white/70" : "text-slate-400"}`} />
            </a>
          )}

          {/* Voice note */}
          {message.type === "voice" && message.fileURL && (
            <VoicePlayer url={message.fileURL} duration={message.duration} isSent={isSent} />
          )}

          {/* Text */}
          {message.text && (
            <p className="text-sm leading-relaxed break-words" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {message.text}
            </p>
          )}

          {/* Time + Status */}
          <div className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
            <span
              className={`text-[10px] ${isSent ? "text-blue-200/60" : "text-slate-500"}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {formatMsgTime(message.timestamp)}
            </span>
            <MessageStatus
              message={message}
              chatMembers={chatMembers}
              currentUid={currentUid}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface Props {
  chat: Chat;
}

export default function ChatWindow({ chat }: Props) {
  const { user } = useAuth();
  const { setActiveChatId } = useChat();
  const { messages, loading, loadMore, hasMore } = useMessages(chat.id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isGroup = chat.type === "group";
  const otherMemberUid = !isGroup ? chat.members.find((m) => m !== user?.uid) : null;
  const { profile: otherProfile } = useUserPresence(otherMemberUid || null);
  const memberProfiles = useMultipleUsers(chat.members);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);

    // Load more when near top
    if (el.scrollTop < 100 && hasMore) {
      loadMore();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendText = async () => {
    if (!text.trim() || !user) return;
    const msgText = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(chat.id, {
        chatId: chat.id,
        senderId: user.uid,
        text: msgText,
        type: "text",
      });
    } catch {
      toast.error("Failed to send message");
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    try {
      setUploadProgress(0);
      const url = await uploadChatImage(chat.id, file, setUploadProgress);
      await sendMessage(chat.id, {
        chatId: chat.id,
        senderId: user.uid,
        type: "image",
        fileURL: url,
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadProgress(null);
    } catch {
      toast.error("Failed to upload image");
      setUploadProgress(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    try {
      setUploadProgress(0);
      const url = await uploadChatFile(chat.id, file, setUploadProgress);
      await sendMessage(chat.id, {
        chatId: chat.id,
        senderId: user.uid,
        type: "file",
        fileURL: url,
        fileName: file.name,
        fileSize: file.size,
      });
      setUploadProgress(null);
    } catch {
      toast.error("Failed to upload file");
      setUploadProgress(null);
    }
  };

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    if (!user) return;
    setShowVoiceRecorder(false);
    try {
      setUploadProgress(0);
      const url = await uploadVoiceNote(chat.id, blob, setUploadProgress);
      await sendMessage(chat.id, {
        chatId: chat.id,
        senderId: user.uid,
        type: "voice",
        fileURL: url,
        duration,
      });
      setUploadProgress(null);
    } catch {
      toast.error("Failed to send voice note");
      setUploadProgress(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      files.forEach((file) => {
        if (file.type.startsWith("image/")) handleImageUpload(file);
        else handleFileUpload(file);
      });
    },
    noClick: true,
    noKeyboard: true,
  });

  // Header info
  const chatName = isGroup
    ? chat.name || "Group"
    : otherProfile?.displayName || "Unknown";
  const chatPhoto = isGroup ? chat.photoURL : otherProfile?.photoURL;
  const isOnline = !isGroup && otherProfile?.online;
  const memberCount = isGroup ? chat.members.length : null;

  return (
    <div
      {...getRootProps()}
      className="flex flex-col h-full bg-[#0f1520] relative"
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-none flex items-center justify-center"
          >
            <div className="text-center">
              <Paperclip className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Drop files to share
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-[#12151e] border-b border-white/5 flex-shrink-0 min-w-0">
        <button
          onClick={() => setActiveChatId(null)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          {chatPhoto ? (
            <img src={chatPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {chatName[0]?.toUpperCase()}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#12151e]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {chatName}
          </h3>
          <p className="text-xs text-slate-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {isGroup
              ? `${memberCount} members`
              : isOnline
              ? "Online"
              : otherProfile?.lastSeen
              ? `Last seen ${format((otherProfile.lastSeen as { toDate: () => Date }).toDate(), "HH:mm")}`
              : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info("Voice calls coming soon")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.info("Video calls coming soon")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-0.5 min-w-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.03) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)`,
        }}
      >
        {/* Load more button */}
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMore}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 bg-blue-500/10 rounded-full"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Load older messages
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div
                  className={`h-10 rounded-2xl bg-white/5 animate-pulse ${
                    i % 2 === 0 ? "w-48" : "w-36"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-slate-400 text-sm text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDate = shouldShowDateSeparator(msg, prev);
            const isSent = msg.senderId === user?.uid;
            const sender = memberProfiles[msg.senderId];

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span
                      className="text-xs text-slate-500 px-3 py-1 bg-white/5 rounded-full"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {formatDateSeparator(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isSent={isSent}
                  chatMembers={chat.members}
                  currentUid={user!.uid}
                  senderName={sender?.displayName}
                  senderPhoto={sender?.photoURL}
                  isGroup={isGroup}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-[#1a1f2e] border border-white/10 text-slate-300 flex items-center justify-center shadow-lg hover:bg-[#252b3b] transition-colors z-10"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      <AnimatePresence>
        {uploadProgress !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 bg-[#1a1f2e] rounded-xl p-3 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {Math.round(uploadProgress)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-3 sm:px-4 pb-4 md:pb-4 pt-2 flex-shrink-0 bg-[#0f1520] min-w-0">
        <AnimatePresence mode="wait">
          {showVoiceRecorder ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <VoiceRecorder
                onSend={handleVoiceSend}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-end gap-2"
            >
              {/* Attachment buttons */}
              <div className="flex items-center gap-1 pb-1">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150 active:scale-95"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150 active:scale-95"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              {/* Text input */}
              <div className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-blue-500/40 transition-colors">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    height: "auto",
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                  }}
                />
              </div>

              {/* Send / Voice button */}
              {text.trim() ? (
                <motion.button
                  onClick={handleSendText}
                  disabled={sending}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow disabled:opacity-50 flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setShowVoiceRecorder(true)}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-2xl bg-[#1a1f2e] border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40 flex items-center justify-center transition-all duration-150 flex-shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
