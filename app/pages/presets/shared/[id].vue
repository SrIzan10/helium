<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div v-if="pending" class="flex justify-center">
      <Spinner />
    </div>
    <Card
      v-else-if="response && response.data.shareable"
      class="w-full max-w-lg shadow-lg"
    >
      <CardHeader class="border-b pb-6">
        <div class="flex items-center gap-3 mb-2">
          <img
            v-if="response.author?.profileImageUrl"
            :src="response.author.profileImageUrl"
            class="w-8 h-8 rounded-full ring-2 ring-background"
            alt="Profile"
          />
          <div
            v-else
            class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-2 ring-background"
          >
            {{
              (response.author?.fullName ||
                response.author?.username ||
                response.author?.email ||
                "?")[0]!.toUpperCase()
            }}
          </div>
          <CardDescription class="text-sm font-medium">
            <span class="text-foreground font-semibold">
              {{ response.author?.fullName || response.author?.username }}
            </span>
            {{ $t("wantsToSharePreset") }}
          </CardDescription>
        </div>
        <CardTitle class="text-2xl pt-2">{{ response.data.name }}</CardTitle>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-1">
            <p
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {{ $t("created") }}
            </p>
            <p class="text-sm font-medium">
              {{
                new Date(response.data.createdAt).toLocaleDateString(
                  undefined,
                  { dateStyle: "medium" },
                )
              }}
            </p>
          </div>
          <div class="space-y-1">
            <p
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {{ $t("servers") }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium"
                >{{ parsedIceServers.length }}
                {{
                  parsedIceServers.length === 1
                    ? $t("iceServerConfigured")
                    : $t("iceServersConfigured")
                }}</span
              >
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-4">
          <div
            class="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <label class="text-sm font-medium cursor-pointer">{{
              $t("activateByDefault")
            }}</label>
            <Switch v-model="setAsDefault" />
          </div>
          <div class="flex justify-end gap-3">
            <Button variant="outline" @click="navigateTo('/')">{{
              $t("cancel")
            }}</Button>
            <Button @click="importPreset" :disabled="isImporting">
              {{ isImporting ? $t("importing") : $t("importPreset") }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    <div v-else-if="!response" class="text-center text-muted-foreground">
      <p>{{ $t("presetNotFound") }}</p>
    </div>
    <div
      v-else-if="response && !response.data.shareable"
      class="text-center text-muted-foreground space-y-4"
    >
      <p class="text-lg font-semibold text-destructive">
        {{ $t("presetCannotBeShared") }}
      </p>
      <p class="text-sm">
        {{ $t("presetSharingDisabled") }}
      </p>
      <Button variant="outline" @click="navigateTo('/')">{{
        $t("goBack")
      }}</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { PresetShareResponse } from "~/lib/types/PresetShareResponse";
import { toast } from "vue-sonner";

const route = useRoute();

const { data: response, pending } = useFetch<PresetShareResponse>(
  `/api/presets/${route.params.id}`,
);

const isImporting = ref(false);
const setAsDefault = ref(true);

const parsedIceServers = computed(() => {
  if (!response.value?.data.iceServers) return [];
  const servers = response.value.data.iceServers;
  return typeof servers === "string" ? JSON.parse(servers) : servers;
});

const importPreset = async () => {
  isImporting.value = true;
  try {
    const result = await $fetch<{ success: boolean; message: string }>(
      `/api/presets/${route.params.id}/import`,
      {
        method: "POST",
        body: {
          setAsDefault: setAsDefault.value,
        },
      },
    );

    if (result.success) {
      // Navigate to presets page after successful import
      await navigateTo("/presets");
    } else {
      // Show error message
      console.error(result.message);
      toast.error(result.message);
    }
  } catch (error) {
    console.error("Failed to import preset:", error);
  } finally {
    isImporting.value = false;
  }
};
</script>
