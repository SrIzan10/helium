<template>
  <div class="h-96 w-full border rounded-md overflow-hidden">
    <ClientOnly
      ><MonacoEditor :options="editorOptions" class="h-full w-full" lang="json"
    /></ClientOnly>
  </div>
</template>

<script setup lang="ts">
import mocha from "~/lib/catppuccin-mocha.json";
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
</script>
