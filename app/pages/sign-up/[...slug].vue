<script setup lang="ts">
const { locale } = useI18n();
const clerkLocaleVersion = useState("clerk-locale-version", () => 0);
</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
    <SignUp :key="`${locale}-${clerkLocaleVersion}`" routing="path" path="/sign-up" />
  </div>
</template>
