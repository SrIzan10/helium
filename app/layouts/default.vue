<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
</script>

<template>
  <div>
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center space-x-6">
        <NuxtLink to="/" class="text-xl font-semibold hover:opacity-80 transition-opacity">
          helium
        </NuxtLink>
        <nav class="flex space-x-4">
          <NuxtLink 
            to="/" 
            class="text-sm font-medium hover:text-primary transition-colors"
            active-class="text-primary"
          >
            Home
          </NuxtLink>
          <NuxtLink 
            to="/stream" 
            class="text-sm font-medium hover:text-primary transition-colors"
            active-class="text-primary"
          >
            Stream
          </NuxtLink>
          <ClientOnly>
            <SignedIn>
              <NuxtLink 
                to="/presets" 
                class="text-sm font-medium hover:text-primary transition-colors"
                active-class="text-primary"
              >
                Presets
              </NuxtLink>
            </SignedIn>
          </ClientOnly>
        </nav>
      </div>
      <div class="flex space-x-4">
        <ThemeDropdown />
        <ClientOnly>
          <SignedOut>
            <SignInDialog />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </ClientOnly>
      </div>
    </header>
    <slot />
    <Toaster />
  </div>
</template>
