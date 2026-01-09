<template>
  <div>
    <p v-if="data">{{ data.data }}</p>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch("/api/presets", { cache: "no-cache" });
</script>
