import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.srizan.helium.mobile",
  appName: "Helium Mobile",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
