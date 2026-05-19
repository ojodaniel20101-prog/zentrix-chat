// Custom hook for real-time chat list subscription

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Chat } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
      orderBy("lastMessage.timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const chatList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Chat[];
        setChats(chatList);
        setLoading(false);
      },
      (err) => {
        console.error("Chat subscription error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  return { chats, loading };
};

export const useChat = (chatId: string | null) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (snap.exists()) {
        setChat({ id: snap.id, ...snap.data() } as Chat);
      } else {
        setChat(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [chatId]);

  return { chat, loading };
};
