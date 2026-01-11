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
                "?")[0]!.toUpperCase()
            }}
          </div>
          <CardDescription class="text-sm font-medium">
            <span class="text-foreground font-semibold">
              {{ response.author?.fullName || response.author?.username }}
            </span>
            wants to share a preset with you
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
              Created
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
              Servers
            </p>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium"
                >{{ parsedIceServers.length }} ICE Servers</span
              >
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <Button variant="outline" @click="navigateTo('/')">Cancel</Button>
          <Button @click="importPreset" :disabled="isImporting">
            {{ isImporting ? 'Importing...' : 'Import Preset' }}
          </Button>
        </div>
      </CardContent>
    </Card>
    <div v-else-if="!response" class="text-center text-muted-foreground">
      <p>Preset not found.</p>
    </div>
    <div
      v-else-if="response && !response.data.shareable"
      class="text-center text-muted-foreground space-y-4"
    >
      <p class="text-lg font-semibold text-destructive">
        This preset cannot be shared
      </p>
      <p class="text-sm">
        The preset owner has not enabled sharing for this preset.
      </p>
      <Button variant="outline" @click="navigateTo('/')">Go Back</Button>
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
import type { PresetShareResponse } from "~/lib/types/PresetShareResponse";
import { toast } from "vue-sonner";

const route = useRoute();

const { data: response, pending } = useFetch<PresetShareResponse>(
  `/api/presets/${route.params.id}`,
);

const isImporting = ref(false);

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
