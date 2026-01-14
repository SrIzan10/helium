<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import LanguageSwitcher from "~/components/LanguageSwitcher.vue";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";

const { t } = useI18n();
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
            {{ t('home') }}
          </NuxtLink>
          <NuxtLink 
            to="/stream" 
            class="text-sm font-medium hover:text-primary transition-colors"
            active-class="text-primary"
          >
            {{ t('stream') }}
          </NuxtLink>
          <ClientOnly>
            <SignedIn>
              <NuxtLink 
                to="/presets" 
                class="text-sm font-medium hover:text-primary transition-colors"
                active-class="text-primary"
              >
                {{ t('presets') }}
              </NuxtLink>
            </SignedIn>
          </ClientOnly>
        </nav>
      </div>
      <div class="flex items-center space-x-4">
        <LanguageSwitcher />
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
