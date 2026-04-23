import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../../lib/theme";

interface ButtonProps extends PressableProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "default",
  label,
  loading = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useAppTheme();

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return theme.muted;
    switch (variant) {
      case "default":
        return theme.primary;
      case "destructive":
        return theme.destructive;
      case "secondary":
        return theme.secondary;
      case "outline":
      case "ghost":
        return pressed ? theme.accent : "transparent";
      default:
        return theme.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") return theme.input;
    return "transparent";
  };

  const getTextColor = () => {
    if (disabled) return theme.mutedForeground;
    switch (variant) {
      case "default":
        return theme.primaryForeground;
      case "destructive":
        return theme.destructiveForeground;
      case "secondary":
        return theme.secondaryForeground;
      case "outline":
      case "ghost":
        return theme.foreground;
      default:
        return theme.primaryForeground;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case "lg":
        return { paddingVertical: 12, paddingHorizontal: 32 };
      case "icon":
        return { padding: 10, width: 40, height: 40, justifyContent: "center", alignItems: "center" } as const;
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: pressed && variant !== "outline" && variant !== "ghost" ? 0.9 : 1,
        },
        getPadding(),
        style as any,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {children ? (
            children
          ) : (
            <Text
              style={[
                styles.text,
                { color: getTextColor(), fontSize: size === "lg" ? 16 : 14 },
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8, // radius-md
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontWeight: "600",
  },
});
