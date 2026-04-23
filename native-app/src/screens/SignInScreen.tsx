import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../lib/theme";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle style={{ textAlign: "center" }}>{t("appTitle")}</CardTitle>
            <CardDescription style={{ textAlign: "center" }}>
              {t("signInSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 4 }}>
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              label={t("email")}
              onChangeText={setEmail}
              placeholder="name@example.com"
              value={email}
            />
            <Input
              label={t("password")}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              value={password}
            />

            <View style={{ height: 16 }} />

            <Button
              disabled={!isLoaded || !email || !password}
              label={t("signIn")}
              loading={!isLoaded}
              onPress={() => {
                void onSignIn();
              }}
              size="lg"
            />

            {status ? (
              <Text style={styles.status}>{status}</Text>
            ) : null}
          </CardContent>
        </Card>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      padding: 24,
    },
    keyboardView: {
      justifyContent: "center",
      flex: 1,
      maxWidth: 500,
      width: "100%",
      alignSelf: "center",
    },
    card: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    status: {
      color: theme.mutedForeground,
      fontSize: 13,
      textAlign: "center",
      marginTop: 16,
    },
  });
}
