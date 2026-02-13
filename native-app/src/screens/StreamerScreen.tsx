import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RTCView } from "react-native-webrtc";

import { useHeliumStreamer } from "../hooks/useHeliumStreamer";
import { useAppTheme } from "../lib/theme";
import { getPresetIceServers, getPresets } from "../lib/presets";
import type { NativeIceServer, PresetUser } from "../types/presets";

export function StreamerScreen() {
  const { getToken, signOut } = useAuth();
  const theme = useAppTheme();

  const [presets, setPresets] = useState<PresetUser[]>([]);
  const [presetId, setPresetId] = useState<string>("");
  const [iceServers, setIceServers] = useState<NativeIceServer[]>([]);
  const [presetStatus, setPresetStatus] = useState<string>("loading presets");

  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    status,
    roomCode,
    viewerCount,
    streamUrl,
    isSharing,
    startSharing,
    stopSharing,
  } = useHeliumStreamer(iceServers);

  useEffect(() => {
    const loadPresets = async (): Promise<void> => {
      const token = await getToken();

      if (!token) {
        setPresetStatus("could not read auth token");
        return;
      }

      try {
        const availablePresets = await getPresets(token);
        setPresets(availablePresets);

        if (!availablePresets.length) {
          setPresetStatus("no presets found");
          return;
        }

        const defaultPreset =
          availablePresets.find((preset) => preset.isDefault) ?? availablePresets[0];

        setPresetId(defaultPreset.presetId);
      } catch (error) {
        setPresetStatus(`failed to load presets: ${(error as Error).message}`);
      }
    };

    void loadPresets();
  }, [getToken]);

  useEffect(() => {
    const loadIceServers = async (): Promise<void> => {
      if (!presetId) {
        return;
      }

      const token = await getToken();
      if (!token) {
        setPresetStatus("missing auth token for preset");
        return;
      }

      try {
        const servers = await getPresetIceServers(token, presetId);
        setIceServers(servers);
        setPresetStatus(`loaded ${servers.length} ICE server entries`);
      } catch (error) {
        setPresetStatus(`failed preset load: ${(error as Error).message}`);
      }
    };

    void loadIceServers();
  }, [getToken, presetId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Helium Streamer</Text>
        <Text style={styles.subtitle}>Share your Android screen to Helium viewers</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preset</Text>
          <Text style={styles.small}>{presetStatus}</Text>

          <View style={styles.presetList}>
            {presets.map((preset) => {
              const selected = presetId === preset.presetId;
              return (
                <Pressable
                  key={preset.presetId}
                  onPress={() => {
                    setPresetId(preset.presetId);
                  }}
                  style={[styles.presetItem, selected ? styles.presetItemSelected : null]}
                >
                  <Text
                    style={[
                      styles.presetItemText,
                      selected ? styles.presetItemTextSelected : null,
                    ]}
                  >
                    {preset.preset.name}
                    {preset.isDefault ? " (default)" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session</Text>
          <Text style={styles.small}>Status: {status}</Text>
          <Text style={styles.small}>Viewers: {viewerCount}</Text>
          <Text style={styles.roomCode}>{roomCode || "------"}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                void startSharing();
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Start screen share</Text>
            </Pressable>

            <Pressable onPress={stopSharing} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.preview}>
          {isSharing && streamUrl ? (
            <RTCView mirror={false} objectFit="contain" streamURL={streamUrl} style={styles.video} />
          ) : (
            <Text style={styles.previewPlaceholder}>Screen preview appears after sharing starts</Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            void signOut();
          }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.background,
      flex: 1,
    },
    container: {
      gap: 12,
      padding: 16,
      paddingBottom: 28,
    },
    title: {
      color: theme.foreground,
      fontSize: 24,
      fontWeight: "700",
    },
    subtitle: {
      color: theme.mutedForeground,
      marginTop: -6,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 8,
      padding: 12,
    },
    cardTitle: {
      color: theme.foreground,
      fontSize: 17,
      fontWeight: "700",
    },
    small: {
      color: theme.mutedForeground,
      fontSize: 13,
    },
    presetList: {
      gap: 8,
    },
    presetItem: {
      backgroundColor: theme.input,
      borderColor: theme.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    presetItemSelected: {
      backgroundColor: theme.secondary,
      borderColor: theme.primary,
    },
    presetItemText: {
      color: theme.foreground,
      fontWeight: "600",
    },
    presetItemTextSelected: {
      color: theme.secondaryForeground,
    },
    roomCode: {
      color: theme.primary,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: 2,
      marginTop: 6,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: theme.primary,
      borderRadius: 10,
      flex: 1,
      paddingVertical: 11,
    },
    primaryButtonText: {
      color: theme.primaryForeground,
      fontWeight: "700",
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: theme.accent,
      borderRadius: 10,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    secondaryButtonText: {
      color: theme.foreground,
      fontWeight: "700",
    },
    preview: {
      alignItems: "center",
      backgroundColor: "#000000",
      borderRadius: 14,
      height: 220,
      justifyContent: "center",
      overflow: "hidden",
    },
    video: {
      height: "100%",
      width: "100%",
    },
    previewPlaceholder: {
      color: theme.mutedForeground,
      paddingHorizontal: 16,
      textAlign: "center",
    },
    signOutButton: {
      alignItems: "center",
      borderColor: theme.destructive,
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 10,
    },
    signOutText: {
      color: theme.destructive,
      fontWeight: "700",
    },
  });
}
