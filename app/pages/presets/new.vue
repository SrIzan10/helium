<template>
  <div class="flex flex-col max-w-2xl m-auto">
    <form
      id="form-tanstack-input"
      @submit.prevent="form.handleSubmit"
      class="space-y-6"
    >
      <FieldGroup>
        <form.Field v-slot="{ field }" name="name">
          <Field :data-invalid="isInvalid(field)">
            <FieldLabel for="form-tanstack-input-username">
              Preset name
            </FieldLabel>
            <Input
              id="form-tanstack-input-username"
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
            <ClientOnly>
              <MonacoEditor
                :model-value="field.state.value"
                :options="editorOptions"
                class="h-full w-full"
                lang="json"
                @update:model-value="field.handleChange"
                @blur="field.handleBlur"
              />
            </ClientOnly>
          </div>
          <FieldError
            v-if="isInvalid(field)"
            :errors="field.state.meta.errors"
          />
        </Field>
      </form.Field>
      <Field orientation="horizontal">
        <!--<Button type="button" variant="outline" @click="form.reset()">
          Reset
        </Button>-->
        <Button type="submit" form="form-tanstack-input">Save</Button>
      </Field>
    </form>
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
  name: z
    .string()
    .min(3, "Name must be at least 3 characters.")
    .max(20, "Name must be at most 20 characters."),
  iceServers: z.string().superRefine((val, ctx) => {
    // below code is ai generated. i am not writing validation myself istg
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a JSON array",
        });
        return;
      }

      // Validate each ICE server object
      parsed.forEach((item, index) => {
        if (typeof item !== "object" || item === null) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: must be an object`,
          });
          return;
        }

        // Validate urls field - can be string or array of strings
        const { urls } = item;
        if (!urls) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'urls' is required`,
          });
          return;
        }

        const urlsList = Array.isArray(urls) ? urls : [urls];

        if (!Array.isArray(urls) && typeof urls !== "string") {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'urls' must be a string or array of strings`,
          });
          return;
        }

        // Validate each URL in the urls list
        urlsList.forEach((url, urlIndex) => {
          if (typeof url !== "string") {
            ctx.addIssue({
              code: "custom",
              message: `Item ${index}: urls[${urlIndex}] must be a string`,
            });
            return;
          }

          // Validate STUN/TURN URL format (RFC 8829)
          const isValidStunUrl = /^stuns?:.+/.test(url);
          const isValidTurnUrl = /^turns?:.+/.test(url);

          if (!isValidStunUrl && !isValidTurnUrl) {
            ctx.addIssue({
              code: "custom",
              message: `Item ${index}: urls[${urlIndex}] must be a valid STUN (stun:) or TURN (turn:/turns:) URL`,
            });
          }
        });

        // Validate optional fields
        if (item.username !== undefined && typeof item.username !== "string") {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'username' must be a string`,
          });
        }

        if (
          item.credential !== undefined &&
          typeof item.credential !== "string"
        ) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'credential' must be a string`,
          });
        }

        if (
          item.credentialType !== undefined &&
          !["password", "oauth"].includes(item.credentialType)
        ) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'credentialType' must be 'password' or 'oauth'`,
          });
        }
      });
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: "Must be valid JSON",
      });
    }
  }),
});
const form = useForm({
  defaultValues: {
    name: "",
    iceServers:
      '[\n\t{ "urls": "stun:stun.l.google.com:19302" }\,\n\t{ "urls": "stun:stun1.l.google.com:19302" }\n]',
  },
  validators: {
    onSubmit: formSchema,
  },
  onSubmit: async ({ value }) => {
    // Parse the JSON string back to an object for submission
    const parsedValue = {
      ...value,
      iceServers: JSON.parse(value.iceServers),
    };
    toast("You submitted the following values:", {
      description: h(
        "pre",
        {
          class:
            "bg-code text-white mt-2 w-[320px] overflow-x-auto rounded-md p-4",
        },
        h("code", JSON.stringify(parsedValue, null, 2)),
      ),
    });
  },
});
function isInvalid(field: any) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}
</script>
