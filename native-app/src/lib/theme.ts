import { useColorScheme } from "react-native";

export interface AppTheme {
  background: string;
  foreground: string;
  card: string;
  border: string;
  input: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  destructive: string;
  destructiveForeground: string;
}

const lightTheme: AppTheme = {
  background: "#FAFAFA", // slightly off-white
  foreground: "#09090b", // zinc-950
  card: "#FFFFFF",
  border: "#E4E4E7", // zinc-200
  input: "#E4E4E7",
  muted: "#F4F4F5", // zinc-100
  mutedForeground: "#71717A", // zinc-500
  primary: "#c026d3", // fuchsia-600
  primaryForeground: "#FFFFFF",
  secondary: "#F4F4F5", // zinc-100
  secondaryForeground: "#18181B", // zinc-900
  accent: "#F4F4F5",
  destructive: "#EF4444", // red-500
  destructiveForeground: "#FFFFFF",
};

const darkTheme: AppTheme = {
  background: "#18181b", // zinc-950 (or slight purple tint per brand: #1a1625)
  foreground: "#FAFAFA", // zinc-50
  card: "#18181b", // Matches background often in shadcn default, or slightly lighter
  border: "#27272A", // zinc-800
  input: "#27272A",
  muted: "#27272A",
  mutedForeground: "#A1A1AA", // zinc-400
  primary: "#d946ef", // fuchsia-500
  primaryForeground: "#1a1625",
  secondary: "#27272A",
  secondaryForeground: "#FAFAFA",
  accent: "#27272A",
  destructive: "#7F1D1D", // red-900
  destructiveForeground: "#FFFFFF",
};

// Override with specific brand colors from oklch analysis if needed
const brandLightTheme = {
  ...lightTheme,
  background: "#fdfbff", // slightly purple white
  primary: "#c026d3",
  secondary: "#f5f3ff", // light violet
};

const brandDarkTheme = {
  ...darkTheme,
  background: "#1e1b2e", // Deep purple/slate
  card: "#1e1b2e",
  border: "#2e2a45",
  input: "#2e2a45",
  muted: "#2e2a45",
  primary: "#e879f9", // bright fuchsia
};

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? brandDarkTheme : brandLightTheme;
}
