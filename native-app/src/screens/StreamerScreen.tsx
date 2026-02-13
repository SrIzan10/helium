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

import { useHeliumStreamer } from "../hooks/useHeliumStreamer";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { useAppTheme } from "../lib/theme";
import { getPresets } from "../lib/presets";
import type { NativeIceServer, PresetUser } from "../types/presets";

export function StreamerScreen() {
  const { getToken, signOut } = useAuth();
  const theme = useAppTheme();
  const { t } = useI18n();

  const [presets, setPresets] = useState<PresetUser[]>([]);
  const [presetId, setPresetId] = useState<string>("");
  const [iceServers, setIceServers] = useState<NativeIceServer[]>([]);
  const [presetStatusKey, setPresetStatusKey] = useState<MessageKey>("loadingPresets");
  const [presetStatusParams, setPresetStatusParams] = useState<
    Record<string, string | number> | undefined
  >(undefined);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    statusKey,
    statusParams,
    roomCode,
    viewerCount,
    isSharing,
    startSharing,
    stopSharing,
  } = useHeliumStreamer(iceServers);

  const selectedPreset = useMemo(() => {
    return presets.find((preset) => preset.presetId === presetId) ?? null;
  }, [presetId, presets]);

  useEffect(() => {
    const loadPresets = async (): Promise<void> => {
      const token = await getToken();

      if (!token) {
        setPresetStatusKey("couldNotReadToken");
        setPresetStatusParams(undefined);
        return;
      }

      try {
        const availablePresets = await getPresets(token);
        setPresets(availablePresets);

        if (!availablePresets.length) {
          setPresetStatusKey("noPresetsFound");
          setPresetStatusParams(undefined);
          return;
        }

        const defaultPreset =
          availablePresets.find((preset) => preset.isDefault) ?? availablePresets[0];

        setPresetId(defaultPreset.presetId);
      } catch (error) {
        setPresetStatusKey("failedToLoadPresets");
        setPresetStatusParams({ message: (error as Error).message });
      }
    };

    void loadPresets();
  }, []);

  useEffect(() => {
    if (!selectedPreset) {
      setIceServers([]);
      return;
    }

    try {
      const rawIceServers = selectedPreset.preset.iceServers;
      const parsedIceServers =
        typeof rawIceServers === "string"
          ? (JSON.parse(rawIceServers) as NativeIceServer[])
          : rawIceServers;

      setIceServers(parsedIceServers ?? []);
      setPresetStatusKey("loadedIceServers");
      setPresetStatusParams({ count: (parsedIceServers ?? []).length });
    } catch {
      setIceServers([]);
      setPresetStatusKey("failedToParsePreset");
      setPresetStatusParams(undefined);
    }
  }, [selectedPreset]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("streamerTitle")}</Text>
        <Text style={styles.subtitle}>{t("streamerSubtitle")}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("preset")}</Text>
          <Text style={styles.small}>{t(presetStatusKey, presetStatusParams)}</Text>

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
                    {preset.isDefault ? ` (${t("defaultLabel")})` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("session")}</Text>
          <Text style={styles.small}>{t("status")}: {t(statusKey, statusParams)}</Text>
          <Text style={styles.small}>{t("viewers")}: {viewerCount}</Text>
          <Text style={styles.roomCode}>{roomCode || "------"}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                void startSharing();
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{t("startShare")}</Text>
            </Pressable>

            <Pressable onPress={stopSharing} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t("stop")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.preview}>
          {isSharing ? (
            <Text style={styles.previewPlaceholder}>
              {t("previewActive")}
            </Text>
          ) : (
            <Text style={styles.previewPlaceholder}>{t("previewIdle")}</Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            void signOut();
          }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>{t("signOut")}</Text>
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
