<template>
  <div class="flex flex-col">
    <form
      :id="formId"
      @submit.prevent="form.handleSubmit"
      class="space-y-6"
    >
      <FieldGroup>
        <form.Field v-slot="{ field }" name="name">
          <Field :data-invalid="isInvalid(field)">
            <FieldLabel :for="`${formId}-name`">
              Preset name
            </FieldLabel>
            <Input
              :id="`${formId}-name`"
              :name="field.name"
              :model-value="field.state.value"
              :aria-invalid="isInvalid(field)"
              placeholder="My ICE Preset"
              autocomplete="off"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldError
              v-if="isInvalid(field)"
              :errors="field.state.meta.errors"
            />
          </Field>
        </form.Field>
      </FieldGroup>
      <form.Field v-slot="{ field }" name="iceServers">
        <Field :data-invalid="isInvalid(field)">
          <FieldLabel>Ice Servers (JSON)</FieldLabel>
          <div
            class="h-96 w-full border rounded-md overflow-hidden focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition"
          >
            <MonacoEditor
              :model-value="field.state.value"
              :options="editorOptions"
              class="h-full w-full"
              lang="json"
              @update:model-value="field.handleChange"
              @blur="field.handleBlur"
            />
          </div>
          <FieldError
            v-if="isInvalid(field)"
            :errors="field.state.meta.errors"
          />
        </Field>
      </form.Field>
      <form.Field v-slot="{ field }" name="default">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel :for="`${formId}-default`">
              Set as default preset
            </FieldLabel>
            <FieldDescription>
              This preset will be selected by default on the preset selector.
            </FieldDescription>
          </FieldContent>
          <Switch
            :id="`${formId}-default`"
            :model-value="field.state.value"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </Field>
      </form.Field>
      <Field orientation="horizontal">
        <Button type="submit" :form="formId">Save</Button>
      </Field>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { schema } from "~/lib/schema/new-preset";

const props = defineProps<{
  initialValues?: {
    name: string;
    iceServers: string;
    default: boolean;
  };
  presetId?: string;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'success'): void
}>();

const formId = computed(() => props.isEdit ? `form-edit-preset-${props.presetId}` : 'form-new-preset');

const editorOptions = {
  automaticLayout: true,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  minimap: { enabled: false },
  theme: "catppuccin-mocha",
};

if (import.meta.client) {
  const monaco = await useMonaco();

  if (monaco) {
    const mocha = await $fetch("/catppuccin-mocha.json");
    monaco.editor.defineTheme("catppuccin-mocha", mocha);
    monaco.editor.setTheme("catppuccin-mocha");
  }
}

const form = useForm({
  defaultValues: props.initialValues || {
    name: "",
    iceServers:
      '[\n\t{ "urls": "stun:stun.l.google.com:19302" }\,\n\t{ "urls": "stun:stun1.l.google.com:19302" }\n]',
    default: false,
  },
  validators: {
    onSubmit: schema,
  },
  onSubmit: async ({ value }) => {
    // Parse the JSON string back to an object for submission
    const parsedValue = {
      ...value,
      iceServers: JSON.parse(value.iceServers),
    };
    
    let url = "/api/presets/create";
    let method = "POST";
    
    if (props.isEdit && props.presetId) {
      url = `/api/presets/${props.presetId}`;
      method = "PUT";
    }

    const request = await $fetch(url, {
      method: method as any,
      body: JSON.stringify(parsedValue),
    });
    
    if (request.success) {
      toast.success(props.isEdit ? "Preset updated successfully!" : "Preset created successfully!");
      emit('success');
    } else {
      toast.error(props.isEdit ? "Failed to update preset." : "Failed to create preset.");
    }
  },
});

function isInvalid(field: any) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}
</script>
