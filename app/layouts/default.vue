<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import LanguageSwitcher from "~/components/app/LanguageSwitcher.vue";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-vue-next";

const { t } = useI18n();
const mobileMenuOpen = ref(false);

const navLinks = [
  { to: "/", label: "home" },
  { to: "/stream", label: "stream" },
  { to: "/about", label: "about" },
  { to: "/presets", label: "presets", requiresAuth: true },
];
</script>

<template>
  <div>
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center space-x-4 md:space-x-6">
        <NuxtLink
          to="/"
          class="text-xl font-semibold hover:opacity-80 transition-opacity"
        >
          helium
        </NuxtLink>
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-4">
          <template v-for="link in navLinks" :key="link.to">
            <ClientOnly v-if="link.requiresAuth">
              <SignedIn>
                <NuxtLink
                  :to="link.to"
                  class="text-sm font-medium hover:text-primary transition-colors"
                  active-class="text-primary"
                >
                  {{ t(link.label) }}
                </NuxtLink>
              </SignedIn>
            </ClientOnly>
            <NuxtLink
              v-else
              :to="link.to"
              class="text-sm font-medium hover:text-primary transition-colors"
              active-class="text-primary"
            >
              {{ t(link.label) }}
            </NuxtLink>
          </template>
        </nav>
      </div>

      <!-- Desktop Right Side -->
      <div class="hidden md:flex items-center space-x-4">
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

      <!-- Mobile Menu -->
      <div class="md:hidden">
        <Sheet v-model:open="mobileMenuOpen">
          <SheetTrigger as-child>
            <button
              class="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu class="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" class="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{{ t("menu") || "Menu" }}</SheetTitle>
            </SheetHeader>
            <nav class="flex flex-col space-y-4 mt-6">
              <template v-for="link in navLinks" :key="link.to">
                <ClientOnly v-if="link.requiresAuth">
                  <SignedIn>
                    <NuxtLink
                      :to="link.to"
                      class="text-sm font-medium hover:text-primary transition-colors py-2"
                      active-class="text-primary"
                      @click="mobileMenuOpen = false"
                    >
                      {{ t(link.label) }}
                    </NuxtLink>
                  </SignedIn>
                </ClientOnly>
                <NuxtLink
                  v-else
                  :to="link.to"
                  class="text-sm font-medium hover:text-primary transition-colors py-2"
                  active-class="text-primary"
                  @click="mobileMenuOpen = false"
                >
                  {{ t(link.label) }}
                </NuxtLink>
              </template>
              <div
                class="flex items-center space-x-4 pt-4 border-t border-border"
              >
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>

    <slot />
    <Toaster />
  </div>
</template>
