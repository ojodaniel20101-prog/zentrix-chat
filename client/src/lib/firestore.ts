// Firestore collection helpers and type definitions

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Collection References ────────────────────────────────────────────────────
export const usersCol = () => collection(db, "users");
export const chatsCol = () => collection(db, "chats");
export const messagesCol = (chatId: string) =>
  collection(db, "chats", chatId, "messages");
export const notificationsCol = () => collection(db, "notifications");

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  online: boolean;
  lastSeen: Timestamp | null;
  fcmToken: string | null;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  name?: string; // group name
  photoURL?: string; // group photo
  members: string[]; // array of UIDs
  admins?: string[]; // group admins
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
    type: "text" | "image" | "file" | "voice";
  };
  createdAt: Timestamp;
  createdBy?: string;
  unreadCount?: Record<string, number>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: "text" | "image" | "file" | "voice";
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // voice note duration in seconds
  timestamp: Timestamp;
  status: "sent" | "delivered" | "read";
  readBy: string[]; // UIDs who have read this message
  deliveredTo: string[]; // UIDs who received this message
  replyTo?: string; // message ID being replied to
  deleted?: boolean;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────
export const getUserByUsername = async (username: string) => {
  const q = query(usersCol(), where("username", "==", username.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as UserProfile;
};

export const getUserById = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as unknown as UserProfile;
};

export const updateUserPresence = async (uid: string, online: boolean) => {
  await updateDoc(doc(db, "users", uid), {
    online,
    lastSeen: serverTimestamp(),
  });
};

export const updateFCMToken = async (uid: string, token: string) => {
  await updateDoc(doc(db, "users", uid), { fcmToken: token });
};

// ─── Chat Helpers ─────────────────────────────────────────────────────────────
export const getOrCreateDirectChat = async (
  uid1: string,
  uid2: string
): Promise<string> => {
  // Check if chat already exists
  const q = query(
    chatsCol(),
    where("type", "==", "direct"),
    where("members", "array-contains", uid1)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const members = d.data().members as string[];
    return members.includes(uid2);
  });
  if (existing) return existing.id;

  // Create new direct chat
  const chatRef = doc(chatsCol());
  await setDoc(chatRef, {
    type: "direct",
    members: [uid1, uid2],
    createdAt: serverTimestamp(),
    unreadCount: { [uid1]: 0, [uid2]: 0 },
  });
  return chatRef.id;
};

export const createGroupChat = async (
  name: string,
  members: string[],
  createdBy: string,
  photoURL?: string
): Promise<string> => {
  const chatRef = doc(chatsCol());
  const unreadCount: Record<string, number> = {};
  members.forEach((m) => (unreadCount[m] = 0));
  await setDoc(chatRef, {
    type: "group",
    name,
    photoURL: photoURL || null,
    members,
    admins: [createdBy],
    createdBy,
    createdAt: serverTimestamp(),
    unreadCount,
  });
  return chatRef.id;
};

// ─── Message Helpers ──────────────────────────────────────────────────────────
export const sendMessage = async (
  chatId: string,
  message: Omit<Message, "id" | "timestamp" | "status" | "readBy" | "deliveredTo">
) => {
  const msgRef = doc(messagesCol(chatId));
  const chatRef = doc(db, "chats", chatId);

  const batch = writeBatch(db);

  batch.set(msgRef, {
    ...message,
    timestamp: serverTimestamp(),
    status: "sent",
    readBy: [message.senderId],
    deliveredTo: [message.senderId],
  });

  batch.update(chatRef, {
    lastMessage: {
      text: message.text || `[${message.type}]`,
      senderId: message.senderId,
      timestamp: serverTimestamp(),
      type: message.type,
    },
  });

  await batch.commit();
  return msgRef.id;
};

export const markMessagesAsRead = async (
  chatId: string,
  uid: string,
  messageIds: string[]
) => {
  const batch = writeBatch(db);
  messageIds.forEach((msgId) => {
    batch.update(doc(db, "chats", chatId, "messages", msgId), {
      readBy: arrayUnion(uid),
      status: "read",
    });
  });
  // Reset unread count
  batch.update(doc(db, "chats", chatId), {
    [`unreadCount.${uid}`]: 0,
  });
  await batch.commit();
};

export const markMessagesAsDelivered = async (
  chatId: string,
  uid: string,
  messageIds: string[]
) => {
  const batch = writeBatch(db);
  messageIds.forEach((msgId) => {
    batch.update(doc(db, "chats", chatId, "messages", msgId), {
      deliveredTo: arrayUnion(uid),
    });
  });
  await batch.commit();
};

// Re-export Firestore utilities for use in hooks
export {
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  collection,
};
