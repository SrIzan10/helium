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
}

const lightTheme: AppTheme = {
  background: "#f0eff5",
  foreground: "#4f4c64",
  card: "#eceaf2",
  border: "#e1dee9",
  input: "#dfdce8",
  muted: "#e7e5ee",
  mutedForeground: "#66637d",
  primary: "#a43ad7",
  primaryForeground: "#ffffff",
  secondary: "#be9bcd",
  secondaryForeground: "#3f3452",
  accent: "#d0cee0",
  destructive: "#b4435a",
};

const darkTheme: AppTheme = {
  background: "#30273b",
  foreground: "#e4deec",
  card: "#2a2234",
  border: "#494055",
  input: "#534a5f",
  muted: "#3b3347",
  mutedForeground: "#bbb3c7",
  primary: "#d28ee8",
  primaryForeground: "#48245f",
  secondary: "#6d4a82",
  secondaryForeground: "#eadcf1",
  accent: "#5a5268",
  destructive: "#d46f7a",
};

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
