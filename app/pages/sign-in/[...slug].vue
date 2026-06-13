<script setup lang="ts">
const { locale } = useI18n();
const clerkLocaleVersion = useState("clerk-locale-version", () => 0);
</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
    <SignIn :key="`${locale}-${clerkLocaleVersion}`" routing="path" path="/sign-in" />
  </div>
</template>
