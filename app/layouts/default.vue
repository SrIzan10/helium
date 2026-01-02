<script setup lang="ts">
import SignInDialog from '~/components/app/SignInDialog.vue';
import ThemeDropdown from '~/components/ui/ThemeDropdown.vue';
</script>

<template>
  <div>
    <header class="flex justify-end p-4">
      <SignedOut>
        <SignInDialog />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
    <ThemeDropdown />
    <slot />
  </div>
</template>
