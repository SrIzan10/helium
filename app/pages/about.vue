<script setup lang="ts">
import { marked } from "marked";
import { Spinner } from "~/components/ui/spinner";

const markdownContent = ref("");
const htmlContent = ref("");
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await fetch("/about.md");
    if (!response.ok) {
      throw new Error("Failed to load about content");
    }
    markdownContent.value = await response.text();
    htmlContent.value = await marked(markdownContent.value);
  } catch (error) {
    console.error("Error loading about page:", error);
    htmlContent.value = "<p>Failed to load about content.</p>";
  } finally {
    loading.value = false;
  }
});

definePageMeta({
  layout: "default",
});
</script>

<template>
  <div class="container max-w-4xl mx-auto px-4 py-8">
    <div
      v-if="loading"
      class="flex items-center justify-center text-center py-12 m-auto"
    >
      <Spinner size="lg" />
    </div>
    <div v-else class="prose max-w-none" v-html="htmlContent" />
  </div>
</template>

<style scoped>
@reference "../assets/css/tailwind.css";
.prose :deep(h1) {
  @apply text-4xl font-bold mb-6;
}

.prose :deep(h2) {
  @apply text-3xl font-semibold mt-8 mb-4;
}

.prose :deep(h3) {
  @apply text-2xl font-semibold mt-6 mb-3;
}

.prose :deep(p) {
  @apply mb-4 leading-7;
}

.prose :deep(ul) {
  @apply list-disc list-inside mb-4 space-y-2;
}

.prose :deep(strong) {
  @apply font-semibold;
}

.prose :deep(a) {
  @apply text-primary hover:underline;
}

.prose :deep(hr) {
  @apply my-8 border-border;
}

.prose :deep(code) {
  @apply bg-muted px-1.5 py-0.5 rounded text-sm;
}

.prose :deep(em) {
  @apply italic;
}
</style>
