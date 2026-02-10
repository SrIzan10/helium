<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import LanguageSwitcher from "~/components/app/LanguageSwitcher.vue";
import { useElectron } from "~/composables/useElectron";
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
import LogoSvg from "~/assets/logo.svg?component";

const { t } = useI18n();
const mobileMenuOpen = ref(false);
const { isElectron, platformInfo, getPlatformInfo } = useElectron();

const isMacElectron = computed(() => {
  return isElectron.value && platformInfo.value?.isMac;
});

onMounted(async () => {
  if (isElectron.value && !platformInfo.value) {
    await getPlatformInfo();
  }
});

const navLinks = [
  { to: "/", label: "home" },
  { to: "/stream", label: "stream" },
  { to: "/about", label: "about" },
  { to: "/presets", label: "presets", requiresAuth: true },
];
</script>

<template>
  <div>
    <header
      class="flex justify-between items-center p-4"
      :class="isMacElectron ? 'pl-24 [-webkit-app-region:drag] select-none' : ''"
    >
      <div
        class="flex items-center space-x-4 md:space-x-6"
        :class="isMacElectron ? '[-webkit-app-region:no-drag]' : ''"
      >
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-lg font-semibold leading-none hover:opacity-80 transition-opacity"
        >
          <LogoSvg class="block w-8 h-8 shrink-0" />
          <span class="leading-none">helium</span>
        </NuxtLink>
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

      <div
        class="hidden md:flex items-center space-x-4"
        :class="isMacElectron ? '[-webkit-app-region:no-drag]' : ''"
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

      <div
        class="md:hidden"
        :class="isMacElectron ? '[-webkit-app-region:no-drag]' : ''"
      >
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
