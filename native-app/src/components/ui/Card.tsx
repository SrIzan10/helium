import React from "react";
import { StyleSheet, Text, TextProps, View, ViewProps } from "react-native";

import { useAppTheme } from "../../lib/theme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  const theme = useAppTheme();
  return (
    <Text
      style={[styles.title, { color: theme.foreground }, style]}
      {...props}
    />
  );
}

export function CardDescription({ style, ...props }: TextProps) {
  const theme = useAppTheme();
  return (
    <Text
      style={[
        styles.description,
        { color: theme.mutedForeground },
        style,
      ]}
      {...props}
    />
  );
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, // radius-xl
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    padding: 18,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  footer: {
    padding: 18,
    paddingTop: 0,
    flexDirection: "row",
    alignItems: "center",
  },
});
