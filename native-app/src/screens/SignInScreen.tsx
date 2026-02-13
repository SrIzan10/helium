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

export function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<string>("");

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
          <ActivityIndicator color="#ffffff" />
        )}
      </Pressable>

      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch",
    backgroundColor: "#f4f8fb",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#0f1f33",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#4a5f79",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#c8d7ea",
    borderRadius: 12,
    borderWidth: 1,
    color: "#11243d",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1366d6",
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  status: {
    color: "#405166",
    fontSize: 13,
    textAlign: "center",
  },
});
