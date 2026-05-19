// Hook for real-time user presence (online/offline status)

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firestore";

export const useUserPresence = (uid: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { profile, loading };
};

export const useMultipleUsers = (uids: string[]) => {
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!uids.length) return;

    const unsubs = uids.map((uid) =>
      onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) {
          setUsers((prev) => ({
            ...prev,
            [uid]: snap.data() as UserProfile,
          }));
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [uids.join(",")]);

  return users;
};
