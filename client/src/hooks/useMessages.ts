// Custom hook for real-time messages subscription with read receipts

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Message } from "@/lib/firestore";
import { markMessagesAsRead, markMessagesAsDelivered } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 50;

export const useMessages = (chatId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!chatId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessages([]);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Message))
          .reverse();

        setMessages(msgs);
        setLoading(false);

        if (snap.docs.length > 0) {
          setLastDoc(snap.docs[snap.docs.length - 1]);
        }
        setHasMore(snap.docs.length === PAGE_SIZE);

        // Mark unread messages as read
        const unread = msgs.filter(
          (m) => m.senderId !== user.uid && !m.readBy?.includes(user.uid)
        );
        if (unread.length > 0) {
          await markMessagesAsRead(chatId, user.uid, unread.map((m) => m.id));
        }

        // Mark as delivered
        const undelivered = msgs.filter(
          (m) =>
            m.senderId !== user.uid && !m.deliveredTo?.includes(user.uid)
        );
        if (undelivered.length > 0) {
          await markMessagesAsDelivered(chatId, user.uid, undelivered.map((m) => m.id));
        }
      },
      (err) => {
        console.error("Messages subscription error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [chatId, user]);

  const loadMore = useCallback(async () => {
    if (!chatId || !lastDoc || !hasMore) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    const snap = await getDocs(q);
    const older = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Message))
      .reverse();

    setMessages((prev) => [...older, ...prev]);
    if (snap.docs.length > 0) {
      setLastDoc(snap.docs[snap.docs.length - 1]);
    }
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, [chatId, lastDoc, hasMore]);

  return { messages, loading, loadMore, hasMore };
};
