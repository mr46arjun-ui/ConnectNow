import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.connectnow.app",
  appName: "ConnectNow",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: true,
      spinnerColor: "#a855f7",
    },
  },
};

export default config;
