// New Group Chat Dialog

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Users, Plus, Trash2 } from "lucide-react";
import { getUserByUsername, createGroupChat } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/firestore";

export default function NewGroupDialog() {
  const { user } = useAuth();
  const { setShowNewGroupDialog, setActiveChatId } = useChat();
  const isMobile = useIsMobile();
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchResult, setSearchResult] = useState<UserProfile | null | "not-found">(null);
  const [members, setMembers] = useState<UserProfile[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const username = searchQuery.trim().replace(/^@/, "").toLowerCase();
      const found = await getUserByUsername(username);
      if (!found || found.uid === user?.uid) {
        setSearchResult("not-found");
      } else if (members.find((m) => m.uid === found.uid)) {
        toast.info("Already added");
        setSearchResult(null);
      } else {
        setSearchResult(found);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const addMember = (member: UserProfile) => {
    setMembers((prev) => [...prev, member]);
    setSearchResult(null);
    setSearchQuery("");
  };

  const removeMember = (uid: string) => {
    setMembers((prev) => prev.filter((m) => m.uid !== uid));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (members.length < 1) {
      toast.error("Add at least one member");
      return;
    }
    if (!user) return;

    setCreating(true);
    try {
      const allMembers = [user.uid, ...members.map((m) => m.uid)];
      const chatId = await createGroupChat(groupName.trim(), allMembers, user.uid);
      setActiveChatId(chatId);
      setShowNewGroupDialog(false);
      // Reset state after creating group
      setGroupName("");
      setSearchQuery("");
      setSearchResult(null);
      setMembers([]);
      toast.success(`Group "${groupName}" created!`);
    } catch {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
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
        onClick={() => setShowNewGroupDialog(false)}
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
            New Group
          </h2>
          <button
            onClick={() => setShowNewGroupDialog(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group name */}
        <div className="mb-4 flex-shrink-0">
          <label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Group Name
          </label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Team Alpha"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        {/* Add members */}
        <div className="mb-4 flex-shrink-0">
          <label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Add Members
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">@</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="username"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-3 py-2.5 bg-white/10 text-slate-300 rounded-xl text-sm disabled:opacity-50 hover:bg-white/20 transition-colors flex-shrink-0"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2"
              >
                {searchResult === "not-found" ? (
                  <p className="text-slate-400 text-xs px-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    No user found
                  </p>
                ) : (
                  <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {searchResult.photoURL ? (
                        <img src={searchResult.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {searchResult.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {searchResult.displayName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">@{searchResult.username}</p>
                    </div>
                    <button
                      onClick={() => addMember(searchResult as UserProfile)}
                      className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Members list */}
        {members.length > 0 && (
          <div className="mb-6 flex-shrink-0 border-t border-white/5 pt-4">
            <p className="text-slate-400 text-xs mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {members.length} member{members.length !== 1 ? "s" : ""} added
            </p>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.uid}
                  className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {m.photoURL ? (
                      <img src={m.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {m.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {m.displayName}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">@{m.username}</p>
                  </div>
                  <button
                    onClick={() => removeMember(m.uid)}
                    className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating || !groupName.trim() || members.length < 1}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 flex-shrink-0 mt-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          Create Group
        </button>
      </motion.div>
    </div>
  );
}
