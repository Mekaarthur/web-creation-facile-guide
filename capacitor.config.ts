import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed681ca274aa49708c41139ffb8c8152',
  appName: 'bikawo',
  webDir: 'dist',
  server: {
    url: "https://ed681ca2-74aa-4970-8c41-139ffb8c8152.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a"
    }
  }
};

export default config;