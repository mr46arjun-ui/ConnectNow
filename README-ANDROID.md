# 📱 ConnectNow - Native Android Application Project

This folder contains the complete **Native Android Project** for ConnectNow, built with **Capacitor** and **React**.

---

### 🚀 How to Run on Android Device or Emulator

#### Method 1: Open in Android Studio (Recommended)
1. Install [Android Studio](https://developer.android.com/studio).
2. Open Android Studio → **File** → **Open** → Select the `android/` folder inside this package.
3. Click the **Run App ▶** button at the top to launch on your connected Android phone or Android Virtual Device (Emulator).
4. To build an installable APK: Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.

#### Method 2: Command Line Build (Requires Java JDK)
```bash
# 1. Sync web assets
npx cap sync android

# 2. Build Debug APK
cd android
./gradlew assembleDebug
```
The output APK file will be created at: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

### 🌐 Connecting Android App to your Backend Server
By default, the Android app connects to your deployed backend. If testing locally:
- Replace `http://localhost:3000` with your computer's local IP address (e.g., `http://192.168.0.184:3000`) inside `capacitor.config.ts`.
