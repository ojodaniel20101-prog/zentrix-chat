// Firebase Cloud Messaging hook
// Requests notification permission and manages FCM token

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { updateFCMToken } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// IMPORTANT: Replace with your actual VAPID key from Firebase Console
// Project Settings → Cloud Messaging → Web Push certificates → Key pair
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

export const useFCM = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!user) return;

    const initFCM = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (!messaging) return;

        // Check current permission
        const currentPerm = Notification.permission;
        setPermission(currentPerm);

        if (currentPerm === "granted") {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.register(
              "/firebase-messaging-sw.js"
            ),
          });
          if (token) {
            setFcmToken(token);
            await updateFCMToken(user.uid, token);
          }

          // Handle foreground messages
          const unsubscribe = onMessage(messaging, (payload) => {
            const { title, body } = payload.notification || {};
            toast(title || "New message", {
              description: body,
              duration: 5000,
            });
          });

          return unsubscribe;
        }
      } catch (err) {
        // FCM not available (HTTP, no VAPID key, etc.) — silently ignore
        console.warn("FCM initialization skipped:", err);
      }
    };

    initFCM();
  }, [user]);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted" && user) {
        const messaging = await getMessagingInstance();
        if (!messaging) return;
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          ),
        });
        if (token) {
          setFcmToken(token);
          await updateFCMToken(user.uid, token);
          toast.success("Push notifications enabled!");
        }
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  return { fcmToken, permission, requestPermission };
};
