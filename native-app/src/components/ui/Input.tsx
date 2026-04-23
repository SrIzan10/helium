import React from "react";
import { StyleSheet, TextInput, TextInputProps, View, Text } from "react-native";

import { useAppTheme } from "../../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={theme.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: "transparent",
            borderColor: error ? theme.destructive : theme.border,
            color: theme.foreground,
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 40, // h-10
    borderWidth: 1,
    borderRadius: 8, // radius-md
    paddingHorizontal: 12,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
