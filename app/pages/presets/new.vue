<template>
  <div class="flex flex-col gap-6 max-w-2xl m-auto">
    <form id="form-tanstack-input" @submit.prevent="form.handleSubmit">
      <FieldGroup>
        <form.Field v-slot="{ field }" name="username">
          <Field :data-invalid="isInvalid(field)">
            <FieldLabel for="form-tanstack-input-username">
              Username
            </FieldLabel>
            <Input
              id="form-tanstack-input-username"
              :name="field.name"
              :model-value="field.state.value"
              :aria-invalid="isInvalid(field)"
              placeholder="shadcn"
              autocomplete="username"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
            <FieldDescription>
              This is your public display name. Must be between 3 and 10
              characters. Must only contain letters, numbers, and underscores.
            </FieldDescription>
            <FieldError
              v-if="isInvalid(field)"
              :errors="field.state.meta.errors"
            />
          </Field>
        </form.Field>
      </FieldGroup>
    </form>
    <div class="h-96 w-full border rounded-md overflow-hidden">
      <ClientOnly>
        <MonacoEditor
          :options="editorOptions"
          class="h-full w-full"
          lang="json"
        />
      </ClientOnly>
    </div>
    <Field orientation="horizontal">
      <Button type="button" variant="outline" @click="form.reset()">
        Reset
      </Button>
      <Button type="submit" form="form-tanstack-input"> Save </Button>
    </Field>
  </div>
</template>

<script setup lang="ts">
import mocha from "~/lib/catppuccin-mocha.json";
import { useForm } from "@tanstack/vue-form";
import { toast } from "vue-sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";

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
    monaco.editor.defineTheme("catppuccin-mocha", mocha);
    monaco.editor.setTheme("catppuccin-mocha");
  }
}

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(10, "Username must be at most 10 characters.")
    .regex(
      /^\w+$/,
      "Username can only contain letters, numbers, and underscores.",
    ),
});
const form = useForm({
  defaultValues: {
    username: "",
  },
  validators: {
    onSubmit: formSchema,
  },
  onSubmit: async ({ value }) => {
    toast("You submitted the following values:", {
      description: h(
        "pre",
        {
          class:
            "bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4",
        },
        h("code", JSON.stringify(value, null, 2)),
      ),
      position: "bottom-right",
      class: "flex flex-col gap-2",
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      },
    });
  },
});
function isInvalid(field: any) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}
</script>
