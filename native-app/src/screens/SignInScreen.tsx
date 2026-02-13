import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppTheme } from "../lib/theme";

export function SignInScreen() {
  const theme = useAppTheme();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const styles = createStyles(theme);

  const onSignIn = async (): Promise<void> => {
    if (!isLoaded) {
      return;
    }

    setStatus("Signing in...");

    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        setStatus("Signed in");
        return;
      }

      setStatus(`Needs extra step: ${attempt.status}`);
    } catch {
      setStatus("Sign-in failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Helium Native</Text>
      <Text style={styles.subtitle}>Sign in with Clerk</Text>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#7e8794"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#7e8794"
        secureTextEntry
        style={styles.input}
        value={password}
      />

      <Pressable
        disabled={!isLoaded || !email || !password}
        onPress={() => {
          void onSignIn();
        }}
        style={styles.button}
      >
        {isLoaded ? (
          <Text style={styles.buttonText}>Sign in</Text>
        ) : (
          <ActivityIndicator color={theme.primaryForeground} />
        )}
      </Pressable>

      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      alignItems: "stretch",
      backgroundColor: theme.background,
      flex: 1,
      gap: 12,
      justifyContent: "center",
      padding: 24,
    },
    title: {
      color: theme.foreground,
      fontSize: 28,
      fontWeight: "700",
      textAlign: "center",
    },
    subtitle: {
      color: theme.mutedForeground,
      marginBottom: 12,
      textAlign: "center",
    },
    input: {
      backgroundColor: theme.input,
      borderColor: theme.border,
      borderRadius: 12,
      borderWidth: 1,
      color: theme.foreground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    button: {
      alignItems: "center",
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 12,
    },
    buttonText: {
      color: theme.primaryForeground,
      fontSize: 16,
      fontWeight: "700",
    },
    status: {
      color: theme.mutedForeground,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
