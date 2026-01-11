<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
    <div v-for="presetUser in data!.data" :key="presetUser.preset.id">
      <Card class="flex flex-col h-full">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>{{ presetUser.preset.name }}</span>
            <Badge v-if="presetUser.isDefault" variant="secondary"
              >Default</Badge
            >
          </CardTitle>
          <CardDescription
            >Created by {{ presetUser.preset.createdBy }}</CardDescription
          >
        </CardHeader>
        <CardContent class="grow">
          <div class="text-sm text-muted-foreground truncate">
            {{ presetUser.preset.iceServers.length }} ICE Server{{
              presetUser.preset.iceServers.length === 1 ? "" : "s"
            }}
            configured
          </div>
        </CardContent>
        <CardFooter class="flex justify-between gap-2 ml-auto">
          <div class="flex gap-2">
            <div
              v-if="user?.id === presetUser.preset.createdBy"
              class="flex gap-2"
            >
              <Button
                variant="outline"
                size="icon"
                @click="handleShare(presetUser.preset)"
              >
                <Share2 />
              </Button>

              <Button
                variant="outline"
                size="icon"
                @click="editPreset(presetUser)"
              >
                <Edit />
              </Button>
            </div>

            <Button
              variant="destructive"
              size="icon"
              @click="deletePreset(presetUser.preset.id)"
            >
              <Trash />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <EditPresetDialog
      v-if="selectedPresetUser"
      :open="isEditDialogOpen"
      @update:open="isEditDialogOpen = $event"
      :preset-user="selectedPresetUser"
      @refresh="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditPresetDialog from "~/components/app/EditPresetDialog.vue";
import { Edit, Share2, Trash } from "lucide-vue-next";
import type { ApiResponse } from "~/lib/types/PresetGetResponse";

const { user } = useUser();
const { data, refresh } = await useFetch<ApiResponse>("/api/presets", {
  cache: "no-cache",
  transform: (response: any) => {
    return {
      ...response,
      data: response.data.map((item: any) => ({
        ...item,
        preset: {
          ...item.preset,
          iceServers:
            typeof item.preset.iceServers === "string"
              ? JSON.parse(item.preset.iceServers)
              : item.preset.iceServers,
        },
      })),
    };
  },
});

const isEditDialogOpen = ref(false);
const selectedPresetUser = ref(null);

function editPreset(presetUser: any) {
  selectedPresetUser.value = presetUser;
  isEditDialogOpen.value = true;
}

async function deletePreset(id: string) {
  if (!confirm("Are you sure you want to delete this preset?")) return;

  try {
    await $fetch(`/api/presets/${id}`, {
      method: "DELETE",
    });
    toast.success("Preset deleted successfully");
    refresh();
  } catch (error) {
    toast.error("Failed to delete preset");
  }
}

async function handleShare(preset: any) {
  if (!confirm("Do you want to share this preset?")) return;
  try {
    const response = await $fetch(`/api/presets/${preset.id}/share`, {
      method: "POST",
    });
    if (!response.success) {
      toast.error("Failed to generate shareable link");
      return;
    }
    const shareableLink = `${window.location.origin}/presets/shared/${preset.id}`;
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied to clipboard");
  } catch (error) {
    toast.error("Failed to share preset");
  }
}
</script>
