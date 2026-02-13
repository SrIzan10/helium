import "react-native-url-polyfill/auto";

import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { SignInScreen } from "./src/screens/SignInScreen";
import { ViewerScreen } from "./src/screens/ViewerScreen";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthReadyGate() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#125dc6" size="large" />
      </View>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <ViewerScreen />
      </SignedIn>
    </>
  );
}

export default function App() {
  if (!publishableKey) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>
          Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
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
    backgroundColor: "#eef4fa",
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: "#9b1026",
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
