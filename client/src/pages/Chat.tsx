// Obsidian Flow Design — Main Chat Page
// Assembles sidebar + chat window with responsive mobile layout

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useChat as useChatData } from "@/hooks/useChats";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import NewChatDialog from "@/components/NewChatDialog";
import NewGroupDialog from "@/components/NewGroupDialog";
import ProfileDialog from "@/components/ProfileDialog";

export default function Chat() {
  const { profile } = useAuth();
  const {
    activeChatId,
    showNewChatDialog,
    showNewGroupDialog,
    showProfileDialog,
  } = useChat();
  const { chat } = useChatData(activeChatId);

  return (
    <div className="w-full h-full flex bg-[#0a0c10] overflow-hidden">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div
        className={`${
          activeChatId ? "hidden md:flex" : "flex"
        } w-full md:w-[360px] lg:w-[400px] flex-shrink-0 border-r border-white/5`}
      >
        <ChatSidebar />
      </div>

      {/* Chat Area */}
      <div
        className={`${
          activeChatId ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0`}
      >
        <AnimatePresence mode="wait">
          {chat ? (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <ChatWindow chat={chat} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-6 bg-[#0f1520]"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                  <MessageSquare className="w-12 h-12 text-slate-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Z</span>
                </div>
              </div>
              <div className="text-center">
                <h2
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Welcome, {profile?.displayName?.split(" ")[0] || "there"}!
                </h2>
                <p
                  className="text-slate-400 text-sm max-w-xs"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Select a conversation from the sidebar or search for a user by
                  their @username to start chatting.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="font-mono text-slate-500">@{profile?.username}</span>
                <span>·</span>
                <span>End-to-end encrypted</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showNewChatDialog && <NewChatDialog />}
        {showNewGroupDialog && <NewGroupDialog />}
        {showProfileDialog && <ProfileDialog />}
      </AnimatePresence>
    </div>
  );
}
