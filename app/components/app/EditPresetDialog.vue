<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Preset</DialogTitle>
        <DialogDescription>
          Make changes to your preset here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <PresetForm
        v-if="open"
        :initial-values="initialValues"
        :preset-id="presetUser.preset.id"
        :is-edit="true"
        @success="onSuccess"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PresetForm from "~/components/app/PresetForm.vue";

const props = defineProps<{
  open: boolean;
  presetUser: any;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "refresh"): void;
}>();

const initialValues = computed(() => ({
  name: props.presetUser.preset.name,
  iceServers:
    typeof props.presetUser.preset.iceServers === "string"
      ? props.presetUser.preset.iceServers
      : JSON.stringify(props.presetUser.preset.iceServers, 2, 2),
  default: props.presetUser.isDefault,
}));

function onSuccess() {
  emit("update:open", false);
  emit("refresh");
}
</script>
