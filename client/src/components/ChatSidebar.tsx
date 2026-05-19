// Obsidian Flow Design — Chat Sidebar
// Icon rail (72px) + expanded panel (260px) layout
// Deep obsidian background, gradient accents, DM Sans typography

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import {
  MessageSquare,
  Users,
  Search,
  Settings,
  LogOut,
  Plus,
  X,
  UserPlus,
  Hash,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useChats } from "@/hooks/useChats";
import { useMultipleUsers } from "@/hooks/useUserPresence";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Chat } from "@/lib/firestore";

const formatTime = (ts: unknown): string => {
  if (!ts) return "";
  const date = (ts as { toDate: () => Date }).toDate?.() || new Date(ts as string);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yy");
};

const Avatar = ({
  src,
  name,
  size = 40,
  online,
}: {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#0a0c10] ${
            online ? "bg-green-400" : "bg-slate-500"
          }`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  );
};

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  currentUid: string;
  otherUsers: Record<string, { displayName: string; photoURL: string | null; online: boolean; username: string }>;
}

const ChatItem = ({ chat, isActive, onClick, currentUid, otherUsers }: ChatItemProps) => {
  const isGroup = chat.type === "group";
  const otherMemberId = chat.members.find((m) => m !== currentUid);
  const otherUser = otherMemberId ? otherUsers[otherMemberId] : null;

  const name = isGroup ? (chat.name || "Group") : (otherUser?.displayName || "Unknown");
  const photo = isGroup ? chat.photoURL : otherUser?.photoURL;
  const online = isGroup ? false : otherUser?.online;
  const unread = chat.unreadCount?.[currentUid] || 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
        isActive
          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20"
          : "hover:bg-white/5"
      }`}
    >
      <Avatar src={photo} name={name} size={44} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {name}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {formatTime(chat.lastMessage?.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-slate-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {chat.lastMessage?.type === "image"
              ? "📷 Photo"
              : chat.lastMessage?.type === "voice"
              ? "🎤 Voice note"
              : chat.lastMessage?.type === "file"
              ? "📎 File"
              : chat.lastMessage?.text || "No messages yet"}
          </span>
          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default function ChatSidebar() {
  const { user, profile, logout } = useAuth();
  const {
    activeChatId,
    setActiveChatId,
    searchQuery,
    setSearchQuery,
    setShowNewChatDialog,
    setShowNewGroupDialog,
    setShowProfileDialog,
  } = useChat();
  const { chats, loading } = useChats();
  const [activeTab, setActiveTab] = useState<"chats" | "groups">("chats");
  const [showSearch, setShowSearch] = useState(false);

  // Collect all other member UIDs
  const allMemberUids = Array.from(
    new Set(
      chats.flatMap((c) => c.members.filter((m) => m !== user?.uid))
    )
  );
  const otherUsers = useMultipleUsers(allMemberUids);

  const filteredChats = chats.filter((c) => {
    const isGroup = c.type === "group";
    if (activeTab === "groups" && !isGroup) return false;
    if (activeTab === "chats" && isGroup) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (isGroup) return c.name?.toLowerCase().includes(q);
      const otherUid = c.members.find((m) => m !== user?.uid);
      const other = otherUid ? otherUsers[otherUid] : null;
      return other?.displayName?.toLowerCase().includes(q) || other?.username?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex h-full">
      {/* Icon Rail */}
      <div className="w-16 bg-[#0a0c10] border-r border-white/5 flex flex-col items-center py-4 gap-2 flex-shrink-0">
        {/* App logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2 shadow-lg shadow-blue-500/20">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 flex flex-col gap-1 w-full px-2">
          {[
            { tab: "chats" as const, icon: MessageSquare, label: "Chats" },
            { tab: "groups" as const, icon: Users, label: "Groups" },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              title={label}
              className={`w-full h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                activeTab === tab
                  ? "bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-blue-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1 w-full px-2">
          <button
            onClick={() => setShowProfileDialog(true)}
            title="Profile"
            className="w-full h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </button>
          <button
            onClick={async () => {
              await logout();
              toast.success("Signed out");
            }}
            title="Sign out"
            className="w-full h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      <div className="flex-1 flex flex-col bg-[#12151e] min-w-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {activeTab === "chats" ? "Messages" : "Groups"}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150"
              >
                {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
              <button
                onClick={() =>
                  activeTab === "groups"
                    ? setShowNewGroupDialog(true)
                    : setShowNewChatDialog(true)
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150"
              >
                {activeTab === "groups" ? <Hash className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="w-11 h-11 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 bg-white/5 rounded" />
                  <Skeleton className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                {activeTab === "groups" ? (
                  <Users className="w-6 h-6 text-slate-500" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <p className="text-slate-500 text-sm text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {searchQuery
                  ? "No results found"
                  : activeTab === "groups"
                  ? "No groups yet"
                  : "No conversations yet"}
              </p>
              <button
                onClick={() =>
                  activeTab === "groups"
                    ? setShowNewGroupDialog(true)
                    : setShowNewChatDialog(true)
                }
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Plus className="w-3 h-3" />
                {activeTab === "groups" ? "Create a group" : "Start a chat"}
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                onClick={() => setActiveChatId(chat.id)}
                currentUid={user!.uid}
                otherUsers={otherUsers as Record<string, { displayName: string; photoURL: string | null; online: boolean; username: string }>}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
