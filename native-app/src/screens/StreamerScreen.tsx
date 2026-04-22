import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
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
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <View style={styles.header}>
          <Text style={styles.title}>{t("streamerTitle")}</Text>
          <Text style={styles.subtitle}>{t("streamerSubtitle")}</Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>{t("preset")}</CardTitle>
            <CardDescription>{t(presetStatusKey, presetStatusParams)}</CardDescription>
          </CardHeader>
          <CardContent style={styles.presetList}>
            {presets.map((preset) => {
              const selected = presetId === preset.presetId;
              return (
                <Button
                  key={preset.presetId}
                  onPress={() => setPresetId(preset.presetId)}
                  variant={selected ? "secondary" : "ghost"}
                  style={{ justifyContent: "flex-start" }}
                >
                  <Text style={{ color: selected ? theme.secondaryForeground : theme.foreground }}>
                     {preset.preset.name}
                     {preset.isDefault ? ` (${t("defaultLabel")})` : ""}
                  </Text>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("session")}</CardTitle>
            <CardDescription>
              {t("status")}: {t(statusKey, statusParams)} • {t("viewers")}: {viewerCount}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 12 }}>
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCode}>{roomCode || "------"}</Text>
            </View>

            <View style={styles.actions}>
              <Button
                onPress={() => void startSharing()}
                label={t("startShare")}
                variant="default"
                style={{ flex: 1 }}
              />
              <Button
                onPress={stopSharing}
                label={t("stop")}
                variant="secondary"
              />
            </View>
          </CardContent>
        </Card>

        <View style={styles.preview}>
          {isSharing ? (
            <Text style={styles.previewPlaceholder}>
              {t("previewActive")}
            </Text>
          ) : (
            <Text style={styles.previewPlaceholder}>{t("previewIdle")}</Text>
          )}
        </View>

        <Button
          onPress={() => void signOut()}
          label={t("signOut")}
          variant="destructive"
          style={{ marginTop: 8 }}
        />
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
      gap: 16,
      padding: 16,
      paddingBottom: 28,
    },
    header: {
      marginBottom: 8,
    },
    title: {
      color: theme.foreground,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    subtitle: {
      color: theme.mutedForeground,
      fontSize: 16,
    },
    presetList: {
      gap: 4,
    },
    roomCodeContainer: {
      alignItems: "center",
      paddingVertical: 12,
      backgroundColor: theme.secondary,
      borderRadius: 8,
      marginBottom: 4,
    },
    roomCode: {
      color: theme.primary,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: 4,
      fontVariant: ["tabular-nums"],
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    preview: {
      alignItems: "center",
      backgroundColor: "#000000",
      borderRadius: 12,
      height: 200,
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    previewPlaceholder: {
      color: theme.mutedForeground,
      paddingHorizontal: 16,
      textAlign: "center",
    },
  });
}
