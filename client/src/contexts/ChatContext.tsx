// Chat Context — manages active chat, sidebar state, and search

import React, { createContext, useContext, useState, useCallback } from "react";

interface ChatContextValue {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showNewChatDialog: boolean;
  setShowNewChatDialog: (show: boolean) => void;
  showNewGroupDialog: boolean;
  setShowNewGroupDialog: (show: boolean) => void;
  showProfileDialog: boolean;
  setShowProfileDialog: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        setActiveChatId,
        sidebarOpen,
        setSidebarOpen,
        searchQuery,
        setSearchQuery,
        showNewChatDialog,
        setShowNewChatDialog,
        showNewGroupDialog,
        setShowNewGroupDialog,
        showProfileDialog,
        setShowProfileDialog,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
