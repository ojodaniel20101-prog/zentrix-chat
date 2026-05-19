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
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
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

const createUserDocument = async (
  user: User,
  extra?: { username?: string; displayName?: string }
) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const rawUsername =
      extra?.username ||
      generateUsername(extra?.displayName || user.displayName || user.email || "user");
    const username = await ensureUniqueUsername(rawUsername);
    await setDoc(userRef, {
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
    });
  } else {
    // Update online status
    await updateDoc(userRef, { online: true, lastSeen: serverTimestamp() });
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load user profile
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
          // Update online status
          await updateDoc(userRef, { online: true, lastSeen: serverTimestamp() });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Set offline on tab close
    const handleBeforeUnload = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { online: false, lastSeen: serverTimestamp() });
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
      await createUserDocument(credential.user, { username, displayName });
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
  }, []);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { online: false, lastSeen: serverTimestamp() });
    }
    await signOut(auth);
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, data as Record<string, unknown>);
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
