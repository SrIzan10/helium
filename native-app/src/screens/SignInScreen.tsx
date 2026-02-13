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
import { useI18n } from "../i18n/I18nProvider";

export function SignInScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const styles = createStyles(theme);

  const onSignIn = async (): Promise<void> => {
    if (!isLoaded) {
      return;
    }

    setStatus(t("signingIn"));

    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        setStatus(t("signedIn"));
        return;
      }

      setStatus(t("needsExtraStep", { status: String(attempt.status) }));
    } catch {
      setStatus(t("signInFailed"));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("appTitle")}</Text>
      <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder={t("email")}
        placeholderTextColor="#7e8794"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder={t("password")}
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
          <Text style={styles.buttonText}>{t("signIn")}</Text>
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
