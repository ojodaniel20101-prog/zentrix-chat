// Obsidian Flow Design — Authentication Context
// Manages Firebase Auth state, user profiles, and presence

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const generateUsername = (displayName: string): string => {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${suffix}`;
};

const ensureUniqueUsername = async (base: string): Promise<string> => {
  const { getDocs, query, where, collection } = await import("firebase/firestore");
  const usersRef = collection(db, "users");
  let username = base;
  let attempts = 0;
  while (attempts < 10) {
    const q = query(usersRef, where("username", "==", username));
    const snap = await getDocs(q);
    if (snap.empty) return username;
    username = base.slice(0, 12) + Math.floor(Math.random() * 90000 + 10000);
    attempts++;
  }
  return username;
};

// Retry a Firestore operation up to `retries` times with a delay.
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 4,
  delayMs = 800
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isOffline =
        (err as { code?: string })?.code === "unavailable" ||
        (err as { message?: string })?.message?.includes("offline");
      if (isOffline && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Firestore: max retries exceeded");
};

// Always use setDoc with merge:true so it works whether the doc
// exists or not. This is the key fix — updateDoc fails on missing docs.
const upsertUserDocument = async (
  user: User,
  extra?: { username?: string; displayName?: string }
) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await withRetry(() => getDoc(userRef));

  if (!snap.exists()) {
    // Brand new user — create full document
    const rawUsername =
      extra?.username ||
      generateUsername(extra?.displayName || user.displayName || user.email || "user");
    const username = await ensureUniqueUsername(rawUsername);
    await withRetry(() =>
      setDoc(userRef, {
        uid: user.uid,
        username,
        displayName: extra?.displayName || user.displayName || username,
        email: user.email,
        photoURL: user.photoURL || null,
        bio: "",
        online: true,
        lastSeen: serverTimestamp(),
        fcmToken: null,
        createdAt: serverTimestamp(),
      })
    );
    // Return the newly created profile
    const newSnap = await withRetry(() => getDoc(userRef));
    return newSnap.exists() ? (newSnap.data() as UserProfile) : null;
  } else {
    // Existing user — just update presence
    await withRetry(() =>
      updateDoc(userRef, { online: true, lastSeen: serverTimestamp() })
    );
    return snap.data() as UserProfile;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await withRetry(() => getDoc(userRef));

          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
            // Update online status — fire and forget
            withRetry(() =>
              updateDoc(userRef, { online: true, lastSeen: serverTimestamp() })
            ).catch(console.warn);
          } else {
            // Doc missing even though user is authed (e.g. Google sign-in
            // where createUserDocument failed previously) — create it now
            const created = await upsertUserDocument(firebaseUser);
            if (created) setProfile(created);
          }
        } catch (err) {
          console.warn("Could not load user profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsub();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpEmail = useCallback(
    async (
      email: string,
      password: string,
      username: string,
      displayName: string
    ) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await upsertUserDocument(credential.user, { username, displayName });
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const loadedProfile = await upsertUserDocument(result.user);
    if (loadedProfile) setProfile(loadedProfile);
  }, []);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
    }
    await signOut(auth);
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      // Use setDoc with merge so it works even if doc somehow doesn't exist
      await withRetry(() =>
        setDoc(userRef, data as Record<string, unknown>, { merge: true })
      );
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
