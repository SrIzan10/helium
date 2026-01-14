<template>
  <div class="px-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">{{ t('presets') }}</h1>
      <Button @click="navigateTo('/presets/new')">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('createNewPreset') }}
      </Button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div v-for="presetUser in data!.data" :key="presetUser.preset.id">
      <Card class="flex flex-col h-full">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>{{ presetUser.preset.name }}</span>
            <Badge v-if="presetUser.isDefault" variant="secondary"
              >{{ t('default') }}</Badge
            >
          </CardTitle>
          <CardDescription
            >{{ t('createdBy') }} {{ presetUser.preset.createdBy }}</CardDescription
          >
        </CardHeader>
        <CardContent class="grow">
          <div class="text-sm text-muted-foreground truncate">
            {{ presetUser.preset.iceServers.length }} {{ presetUser.preset.iceServers.length === 1 ? t('iceServerConfigured') : t('iceServersConfigured') }} {{ t('configured') }}
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
import { Edit, Share2, Trash, Plus } from "lucide-vue-next";
import type { ApiResponse } from "~/lib/types/PresetGetResponse";

const { t } = useI18n();
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
  if (!confirm(t('deletePresetConfirm'))) return;

  try {
    await $fetch(`/api/presets/${id}`, {
      method: "DELETE",
    });
    toast.success(t('presetDeletedSuccessfully'));
    refresh();
  } catch (error) {
    toast.error(t('failedToDeletePreset'));
  }
}

async function handleShare(preset: any) {
  if (!confirm(t('sharePresetConfirm'))) return;
  try {
    const response = await $fetch(`/api/presets/${preset.id}/share`, {
      method: "POST",
    });
    if (!response.success) {
      toast.error(t('failedToGenerateShareableLink'));
      return;
    }
    const shareableLink = `${window.location.origin}/presets/shared/${preset.id}`;
    navigator.clipboard.writeText(shareableLink);
    toast.success(t('linkCopiedToClipboard'));
  } catch (error) {
    toast.error(t('failedToSharePreset'));
  }
}
</script>
