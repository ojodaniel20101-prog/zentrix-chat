// Firebase Cloud Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDRLnXhRtW6XWzfwzgSSAxGm5h39AvRUEg",
  authDomain: "zentrix-chat.firebaseapp.com",
  projectId: "zentrix-chat",
  storageBucket: "zentrix-chat.firebasestorage.app",
  messagingSenderId: "318694299710",
  appId: "1:318694299710:web:8b5f5596b5ed211b11596f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Zentrix Chat', {
    body: body || 'You have a new message',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open Chat' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
