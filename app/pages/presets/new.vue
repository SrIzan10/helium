<template>
  <ClientOnly>
    <div ref="editorContainer" class="h-96 w-full border rounded-md overflow-hidden"></div>
  </ClientOnly>

</template>

<script setup lang="ts">
import mocha from "@catppuccin/vscode/themes/mocha.json";

const editorContainer = ref<HTMLElement | null>(null);
const editorInstance = shallowRef<any>(null);
const monaco = useMonaco();
const value = ref('');

onMounted(() => {
  if (!monaco.value) return;

  // Transformation logic for VS Code -> Monaco
  const rules = (mocha as any).tokenColors.flatMap((color: any) => {
    const scopes = Array.isArray(color.scope) ? color.scope : [color.scope];
    return scopes.map((scope: string) => ({
      token: scope || '',
      foreground: color.settings.foreground,
      fontStyle: color.settings.fontStyle,
    }));
  });

  monaco.value.editor.defineTheme('catppuccin-mocha', {
    base: 'vs-dark',
    inherit: true,
    rules: rules,
    colors: (mocha as any).colors
  });

  if (editorContainer.value) {
    editorInstance.value = monaco.value.editor.create(editorContainer.value, {
      value: value.value,
      language: 'typescript',
      theme: 'catppuccin-mocha',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
    });

    // Sync value changes back to ref
    editorInstance.value.onDidChangeModelContent(() => {
      value.value = editorInstance.value.getValue();
    });
  }
});

onBeforeUnmount(() => {
  editorInstance.value?.dispose();
});
</script>
