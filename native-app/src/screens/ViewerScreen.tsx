import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RTCView } from "react-native-webrtc";

import { useHeliumViewer } from "../hooks/useHeliumViewer";

export function ViewerScreen() {
  const { signOut } = useAuth();
  const [roomCode, setRoomCode] = useState<string>("");
  const { connect, disconnect, isConnected, status, streamUrl } = useHeliumViewer();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Helium Viewer</Text>
        <Text style={styles.status}>{status}</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(text: string) => {
            setRoomCode(text.replace(/\D/g, ""));
          }}
          placeholder="Enter 6-digit room code"
          placeholderTextColor="#6a7a8e"
          style={styles.input}
          value={roomCode}
        />

        <View style={styles.actions}>
          <Pressable
            disabled={roomCode.length !== 6}
            onPress={() => {
              connect(roomCode);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Connect</Text>
          </Pressable>

          <Pressable onPress={disconnect} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Disconnect</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void signOut();
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.videoWrap}>
          {isConnected && streamUrl ? (
            <RTCView
              mirror={false}
              objectFit="contain"
              streamURL={streamUrl}
              style={styles.video}
            />
          ) : (
            <Text style={styles.placeholder}>No stream yet</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f0f6fd",
    flex: 1,
  },
  container: {
    flex: 1,
    gap: 12,
    padding: 18,
  },
  title: {
    color: "#12263c",
    fontSize: 22,
    fontWeight: "700",
  },
  status: {
    color: "#4f6278",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d3deeb",
    borderRadius: 12,
    borderWidth: 1,
    color: "#10233b",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#0e68de",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#e4edf8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#21354d",
    fontWeight: "600",
  },
  videoWrap: {
    alignItems: "center",
    backgroundColor: "#0a121e",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    color: "#92a3b8",
  },
});
