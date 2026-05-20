// Obsidian Flow Design — Main Chat Page
// Assembles sidebar + chat window with responsive mobile layout

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, User, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useChat as useChatData } from "@/hooks/useChats";
import { useIsMobile } from "@/hooks/useMobile";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import NewChatDialog from "@/components/NewChatDialog";
import NewGroupDialog from "@/components/NewGroupDialog";
import ProfileDialog from "@/components/ProfileDialog";

export default function Chat() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const {
    activeChatId,
    setActiveChatId,
    showNewChatDialog,
    showNewGroupDialog,
    showProfileDialog,
    setShowProfileDialog,
  } = useChat();
  const { chat } = useChatData(activeChatId);
  const [mobileTab, setMobileTab] = React.useState<"chats" | "search" | "groups" | "profile">("chats");
  
  // Handle back button on mobile when viewing a chat
  React.useEffect(() => {
    if (activeChatId && isMobile) {
      setMobileTab("chats");
    }
  }, [activeChatId, isMobile]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#0a0c10] overflow-hidden">
      {/* Sidebar — hidden on mobile, shown on tablet+ */}
      <div className="hidden md:flex md:w-[360px] lg:w-[400px] flex-shrink-0 border-r border-white/5 flex-col">
        <ChatSidebar />
      </div>

      {/* Mobile Tab Content */}
      {isMobile && mobileTab !== "chats" && (
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {mobileTab === "search" && (
            <div className="flex-1 flex items-center justify-center">
              <NewChatDialog />
            </div>
          )}
          {mobileTab === "groups" && (
            <div className="flex-1 flex items-center justify-center">
              <NewGroupDialog />
            </div>
          )}
          {mobileTab === "profile" && (
            <div className="flex-1 flex items-center justify-center">
              <ProfileDialog />
            </div>
          )}
        </div>
      )}

      {/* Chat Area — full width on mobile when chats tab is active */}
      {!(isMobile && mobileTab !== "chats") && (
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
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
              <div className="text-center px-4">
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
      )}

      {/* Dialogs — only on desktop */}
      {!isMobile && (
        <AnimatePresence>
          {showNewChatDialog && <NewChatDialog />}
          {showNewGroupDialog && <NewGroupDialog />}
          {showProfileDialog && <ProfileDialog />}
        </AnimatePresence>
      )}

      {/* Mobile Bottom Navigation — only show when not viewing a chat */}
      {!(isMobile && activeChatId) && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#12151e] border-t border-white/5 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => setMobileTab("chats")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
            mobileTab === "chats" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">Chats</span>
        </button>
        <button
          onClick={() => setMobileTab("search")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
            mobileTab === "search" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs font-medium">Search</span>
        </button>
        <button
          onClick={() => setMobileTab("groups")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
            mobileTab === "groups" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs font-medium">Groups</span>
        </button>
        <button
          onClick={() => setMobileTab("profile")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
            mobileTab === "profile" ? "text-blue-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
      )}
    </div>
  );
}
