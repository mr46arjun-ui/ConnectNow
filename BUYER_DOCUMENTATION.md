# 🚀 ConnectNow v1.0 - Commercial Source Code & Buyer Manual

Welcome to **ConnectNow**, a feature-packed, production-ready Real-Time Social Chat, Random Anonymous Matching, and WebRTC Audio/Video Calling Platform built with React, Node.js, Express, Socket.IO, Drizzle ORM, and Capacitor Android.

---

## 🌟 Key Features

### 💬 1. Group Chat & Public Rooms
- **Public & Private Rooms**: Create public rooms or password-protected private chat rooms.
- **Rich Media Embeds**: Inline video player for YouTube & Vimeo links, direct MP4/WebM video players, MP3 audio players, and image previews.
- **Media File Uploads**: Share pictures, videos, voice notes, and documents directly in chat.
- **Live Emoji Reactions**: Interactive emoji picker with real-time reaction counters on every message bubble.
- **Message Quote & Reply**: Hover any message to quote & reply directly with quote preview.
- **User Mentions & Tagging**: Auto-complete `@handle` suggestions and instant click-to-tag user handles.
- **Group Info & Member Modals**: Inspect room details, privacy settings, live member lists, and role badges.

### 👤 2. User Profiles & Social System
- **User Profile Cards**: Click any user avatar to view their avatar, bio, location, role, and verification badge.
- **Friend System**: Send, accept, or reject real-time friend requests.
- **Audio Cues**: Built-in Web Audio synthesizer for message sending, receiving, and mention alerts (with header Mute toggle).

### 🔀 3. Anonymous Random Matching (y99 / Omegle Style)
- Instant guest matching mode for 1-on-1 random text, voice, and video chats.
- Zero-friction guest onboarding with auto-generated session keys.

### 🎥 4. WebRTC Voice & Video Calling
- Multi-peer Mesh WebRTC engine for group audio and video calls.
- Mute microphone, toggle camera, screen sharing, and active speaker highlighting.

### 📱 5. Native Android Application
- Complete **Capacitor Android Studio Project** in the `./android` folder.
- Pre-configured Android Manifest, WebRTC camera/mic permissions, dark splash screen, and APK build scripts.

---

## 🛠️ Installation & Setup Guide

### System Requirements
- Node.js `v18+` or `v20+`
- pnpm `v9+` or `v10+` (or npm / yarn)
- MySQL `v8.0+` or PostgreSQL

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database URL and JWT secret in `.env`:
```env
DATABASE_URL=mysql://connectnow:your_password@localhost:3306/connectnow
JWT_SECRET=a_super_secret_jwt_key_that_is_at_least_32_characters_long
NODE_ENV=production
PORT=3000
```

### 3. Build & Run Production Server
```bash
pnpm build
pnpm start
```
Your app is now live at `http://localhost:3000`!

---

## 📱 Building the Native Android APK

1. Open **Android Studio**.
2. Go to **File** → **Open** → Select the `./android` folder in this package.
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
4. Your installable `app-debug.apk` will be generated in `android/app/build/outputs/apk/debug/`.

---

## ☁️ Deployment Guide

### Deploying to Render.com (100% Free Tier)
1. Push this project to your GitHub repository.
2. Sign up on [Render.com](https://render.com).
3. Create a **MySQL / PostgreSQL** database and copy the Internal Connection URL.
4. Create a **Web Service**, link your GitHub repo, and set:
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Environment Variables**: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
5. Render will automatically build and issue a free SSL HTTPS web link!

---

## 📄 License & Ownership
This package includes full commercial resale, modification, white-labeling, and client deployment rights. See `LICENSE` for full terms.
