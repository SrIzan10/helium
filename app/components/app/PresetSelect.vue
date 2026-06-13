<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-vue-next";
import type { ApiResponse, PresetUser } from "~/lib/types/PresetGetResponse";
import { useStreamerStore } from "~/state/streamer";

const { t } = useI18n();
const router = useRouter();
const selectedValue = ref("");
const modelValue = defineModel<string>({ default: "" });
const presets = ref<PresetUser[]>([]);
const loading = ref(true);
const streamerStore = useStreamerStore();

onMounted(async () => {
  try {
    const response = await $fetch<ApiResponse>("/api/presets");
    if (response.success) {
      presets.value = response.data;

      const defaultPreset = presets.value.find((p) => p.isDefault);
      if (defaultPreset) {
        selectedValue.value = defaultPreset.presetId;
        modelValue.value = defaultPreset.presetId;
        // Load the default preset's ice servers
        loadPresetIceServers(defaultPreset.presetId);
      }
    }
  } catch (error) {
    console.error("Failed to fetch presets:", error);
  } finally {
    loading.value = false;
  }
});

async function loadPresetIceServers(presetId: string) {
  try {
    const response = await $fetch(`/api/presets/${presetId}`);
    const preset = response?.data || response;
    if (preset && preset.iceServers) {
      // Parse ice servers if it's a string
      let iceServers = preset.iceServers;
      if (typeof iceServers === "string") {
        iceServers = JSON.parse(iceServers);
      }
      // Set the ice servers on the streamer store
      streamerStore.setIceServers(iceServers);
    }
  } catch (error) {
    console.error("Failed to load preset ice servers:", error);
  }
}

watch(selectedValue, (newValue) => {
  if (newValue === "create-new") {
    router.push("/presets/new");
    selectedValue.value = "";
    modelValue.value = "";
  } else if (newValue) {
    modelValue.value = newValue;
    // Load ice servers for the selected preset
    loadPresetIceServers(newValue);
  } else {
    modelValue.value = "";
  }
});

watch(modelValue, (newValue) => {
  if (newValue !== selectedValue.value) {
    selectedValue.value = newValue;
  }
});
</script>

<template>
  <Select v-model="selectedValue" :disabled="loading">
    <SelectTrigger class="w-[180px]">
      <SelectValue
        :placeholder="loading ? t('loadingPresets') : t('selectAPreset')"
      />
    </SelectTrigger>
    <SelectContent>
      <div
        v-if="presets.length === 0 && !loading"
        class="px-2 py-1.5 text-sm text-muted-foreground"
      >
        {{ t('noPresetsAvailable') }}
      </div>

      <div v-else-if="!loading">
        <div v-for="preset in presets" :key="preset.presetId">
          <SelectItem :value="preset.presetId">
            <span :class="{ 'font-semibold': preset.isDefault }">
              {{ preset.preset.name }}
            </span>
            <span
              v-if="preset.isDefault"
              class="ml-2 text-xs text-muted-foreground"
              >({{ t('default') }})</span
            >
          </SelectItem>
        </div>
        <SelectSeparator />
      </div>

      <SelectItem value="create-new">
        <div class="font-bold flex gap-2 items-center">
          <Plus class="size-4" />
          {{ t('createNewPreset') }}
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
