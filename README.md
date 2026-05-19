# Zentrix Chat

A premium, full-stack realtime chat application built with **React + Vite** and **Firebase** as the complete backend. Features a WhatsApp-inspired dark UI with deep blue/purple gradient accents, smooth spring-physics animations, and a professional "Obsidian Flow" design system.

![Zentrix Chat](https://img.shields.io/badge/React-19-blue?logo=react) ![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan?logo=tailwindcss)

---

## Features

- **Authentication** — Email/password registration and login, Google OAuth sign-in, automatic account linking when the same email is used across both methods
- **Unique @usernames** — Every user gets a searchable unique username on signup
- **User Search** — Find any user by their @username to start a private conversation
- **1-on-1 Messaging** — Real-time private messaging powered by Firestore listeners
- **Group Chats** — Create groups, add members by @username, group admin controls
- **Read Receipts** — Single ✓ (sent), double ✓✓ (delivered), blue ✓✓ (read by all)
- **Online/Offline Status** — Real-time presence indicator with last-seen timestamp
- **Voice Notes** — Record and send voice messages directly in the browser
- **Image & File Sharing** — Drag-and-drop or click to share images and files via Firebase Storage
- **Push Notifications** — Firebase Cloud Messaging for background message alerts
- **Dark Theme** — Obsidian Flow design: deep dark base with blue-purple gradient accents
- **Loading Skeletons** — Smooth skeleton loaders instead of blank screens
- **Mobile Responsive** — Full mobile layout with bottom navigation feel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript 5.6 |
| Styling | Tailwind CSS 4, Framer Motion |
| UI Components | shadcn/ui (Radix UI) |
| Authentication | Firebase Auth (Email + Google OAuth) |
| Database | Cloud Firestore (real-time) |
| File Storage | Firebase Storage |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Routing | Wouter |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
zentrix-chat/
├── client/
│   ├── index.html                    # Entry HTML with Google Fonts
│   ├── public/
│   │   ├── firebase-messaging-sw.js  # FCM service worker
│   │   └── manifest.json             # PWA manifest
│   └── src/
│       ├── components/
│       │   ├── ChatSidebar.tsx       # Icon rail + chat list panel
│       │   ├── ChatWindow.tsx        # Message area + input bar
│       │   ├── LoadingScreen.tsx     # Firebase init loading screen
│       │   ├── MessageStatus.tsx     # Read receipt indicators
│       │   ├── NewChatDialog.tsx     # Search user by @username
│       │   ├── NewGroupDialog.tsx    # Create group chat
│       │   ├── ProfileDialog.tsx     # View/edit user profile
│       │   ├── VoicePlayer.tsx       # Voice note playback
│       │   └── VoiceRecorder.tsx     # Voice note recording
│       ├── contexts/
│       │   ├── AuthContext.tsx       # Firebase Auth state + helpers
│       │   └── ChatContext.tsx       # Active chat + dialog state
│       ├── hooks/
│       │   ├── useChats.ts           # Real-time chat list subscription
│       │   ├── useFCM.ts             # FCM token + notification handling
│       │   ├── useMessages.ts        # Real-time messages + pagination
│       │   └── useUserPresence.ts    # Real-time user presence
│       ├── lib/
│       │   ├── firebase.ts           # Firebase app initialization
│       │   ├── firestore.ts          # Firestore helpers + types
│       │   └── storage.ts            # Firebase Storage upload helpers
│       ├── pages/
│       │   ├── Auth.tsx              # Login + Register page
│       │   └── Chat.tsx              # Main chat application page
│       ├── App.tsx                   # Routes + context providers
│       ├── index.css                 # Obsidian Flow design tokens
│       └── main.tsx                  # React entry point
├── firestore.rules                   # Firestore security rules
├── storage.rules                     # Firebase Storage security rules
├── firebase.json                     # Firebase project config
└── README.md
```

---

## Firebase Setup (Step by Step)

### Step 1 — Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) and click **Add project**
2. Enter project name (e.g., `zentrix-chat`) and follow the wizard
3. Enable Google Analytics if desired

### Step 2 — Enable Authentication

1. In Firebase Console, navigate to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable:
   - **Email/Password** — toggle on, save
   - **Google** — toggle on, add your support email, save
4. Under **Settings → Authorized domains**, add your Vercel deployment domain (e.g., `zentrix-chat.vercel.app`)

### Step 3 — Create Firestore Database

1. Navigate to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (security rules are applied separately)
4. Select a region close to your users (e.g., `us-central1`)
5. After creation, go to the **Rules** tab and paste the contents of `firestore.rules`
6. Click **Publish**

### Step 4 — Create Required Indexes

Firestore requires composite indexes for some queries. Create these in **Firestore → Indexes → Composite**:

| Collection | Fields | Order |
|---|---|---|
| `chats` | `members` (Array Contains), `lastMessage.timestamp` (Descending) | — |
| `chats/{id}/messages` | `timestamp` (Descending) | — |

Alternatively, the app will log index creation links in the browser console on first run — click those links to auto-create them.

### Step 5 — Set Up Firebase Storage

1. Navigate to **Build → Storage**
2. Click **Get started** and follow the wizard
3. After creation, go to the **Rules** tab and paste the contents of `storage.rules`
4. Click **Publish**

### Step 6 — Get Your Web App Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **Your apps**, click **Add app → Web** (or select existing)
3. Copy the `firebaseConfig` object — these are your environment variables

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

> **Note:** The `VITE_FIREBASE_VAPID_KEY` is required for push notifications. See the FCM section below.

---

## FCM Push Notifications Setup

### Step 1 — Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings → Cloud Messaging**
2. Under **Web Push certificates**, click **Generate key pair**
3. Copy the generated **Key pair** value — this is your `VITE_FIREBASE_VAPID_KEY`

### Step 2 — Configure Service Worker

The file `client/public/firebase-messaging-sw.js` is already configured with your Firebase project credentials. This service worker handles background notifications when the app is not in focus.

### Step 3 — Request Permission

The app automatically requests notification permission after the user logs in. Users can also manually enable it from the notification prompt. The FCM token is stored in the user's Firestore document (`users/{uid}/fcmToken`) for server-side targeting.

### Step 4 — Send Notifications (Server-Side)

To send push notifications from a server or Cloud Function:

```javascript
const admin = require('firebase-admin');

await admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: 'New message from Alice',
    body: 'Hey, are you free tonight?',
  },
  data: {
    chatId: 'chat_id_here',
    senderId: 'sender_uid',
  },
});
```

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/ojodaniel20101-prog/zentrix-chat
cd zentrix-chat

# Install dependencies
pnpm install

# Create .env file (see Environment Variables section above)
cp env.example .env
# Edit .env with your Firebase credentials

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial Zentrix Chat deployment"
git push origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import your GitHub repository `ojodaniel20101-prog/zentrix-chat`
4. Configure the build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client` (important — the Vite app lives in `/client`)
   - **Build Command:** `pnpm run build` (or `npm run build`)
   - **Output Directory:** `dist`

### Step 3 — Add Environment Variables

In Vercel project settings under **Environment Variables**, add all variables from your `.env` file:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_VAPID_KEY
```

### Step 4 — Add Vercel Domain to Firebase Auth

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain (e.g., `zentrix-chat.vercel.app`)

### Step 5 — Deploy

Click **Deploy**. Vercel will build and deploy the app. Subsequent pushes to `main` will trigger automatic re-deployments.

---

## Firestore Data Model

```
users/
  {uid}/
    uid: string
    username: string          # unique, lowercase, searchable
    displayName: string
    email: string
    photoURL: string | null
    bio: string
    online: boolean
    lastSeen: Timestamp
    fcmToken: string | null
    createdAt: Timestamp

chats/
  {chatId}/
    type: "direct" | "group"
    name?: string             # group only
    photoURL?: string         # group only
    members: string[]         # array of UIDs
    admins?: string[]         # group only
    lastMessage: {
      text: string
      senderId: string
      timestamp: Timestamp
      type: "text" | "image" | "file" | "voice"
    }
    createdAt: Timestamp
    createdBy?: string
    unreadCount: { [uid]: number }

    messages/
      {messageId}/
        chatId: string
        senderId: string
        text?: string
        type: "text" | "image" | "file" | "voice"
        fileURL?: string
        fileName?: string
        fileSize?: number
        duration?: number     # voice note seconds
        timestamp: Timestamp
        status: "sent" | "delivered" | "read"
        readBy: string[]      # UIDs who read this
        deliveredTo: string[] # UIDs who received this
        deleted?: boolean
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
