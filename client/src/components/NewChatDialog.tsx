// New Chat Dialog — Search users by @username

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, MessageSquare } from "lucide-react";
import { getUserByUsername, getOrCreateDirectChat } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/firestore";

export default function NewChatDialog() {
  const { user } = useAuth();
  const { setShowNewChatDialog, setActiveChatId } = useChat();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<UserProfile | null | "not-found">(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const username = query.trim().replace(/^@/, "").toLowerCase();
      const found = await getUserByUsername(username);
      if (!found || found.uid === user?.uid) {
        setResult("not-found");
      } else {
        setResult(found);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async () => {
    if (!result || result === "not-found" || !user) return;
    try {
      const chatId = await getOrCreateDirectChat(user.uid, result.uid);
      setActiveChatId(chatId);
      setShowNewChatDialog(false);
      // Reset state after starting chat
      setQuery("");
      setResult(null);
    } catch {
      toast.error("Failed to start chat");
    }
  };

  return (
    <div className={`${isMobile ? "w-full h-full" : "fixed inset-0 z-50"} flex items-center justify-center p-4`}>
      {!isMobile && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowNewChatDialog(false)}
      />
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className={`relative w-full ${isMobile ? "h-full max-w-none rounded-none" : "max-w-md rounded-2xl"} bg-[#12151e] border ${isMobile ? "border-0" : "border-white/10"} p-6 shadow-2xl z-10 overflow-y-auto flex flex-col`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            New Chat
          </h2>
          <button
            onClick={() => setShowNewChatDialog(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Search for a user by their @username to start a conversation.
        </p>

        <div className="flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">@</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="username"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4"
            >
              {result === "not-found" ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    No user found with that username
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {result.photoURL ? (
                      <img src={result.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {result.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {result.displayName}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">@{result.username}</p>
                    {result.bio && (
                      <p className="text-xs text-slate-500 truncate mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {result.bio}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
