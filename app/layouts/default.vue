<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <div>
    <header class="flex justify-end p-4 space-x-4">
      <ThemeDropdown />
      <ClientOnly>
        <SignedOut>
          <SignInDialog />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </ClientOnly>
    </header>
    <slot />
    <Toaster />
  </div>
</template>
