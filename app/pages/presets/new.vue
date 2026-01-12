<template>
  <div class="flex flex-col max-w-2xl m-auto">
    <PresetForm @success="router.push('/presets')" />
  </div>
</template>

<script setup lang="ts">
import PresetForm from "~/components/app/PresetForm.vue";

const router = useRouter();
</script>
