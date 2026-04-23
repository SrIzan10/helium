import "react-native-url-polyfill/auto";

import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { I18nProvider, useI18n } from "./src/i18n/I18nProvider";
import { useAppTheme } from "./src/lib/theme";
import { SignInScreen } from "./src/screens/SignInScreen";
import { StreamerScreen } from "./src/screens/StreamerScreen";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthReadyGate() {
  const theme = useAppTheme();
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <StreamerScreen />
      </SignedIn>
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const theme = useAppTheme();
  const { t } = useI18n();

  if (!publishableKey) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.destructive }]}>
          {t("missingClerkKey")}
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthReadyGate />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
