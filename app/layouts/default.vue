<script setup lang="ts">
import SignInDialog from "~/components/app/SignInDialog.vue";
import ThemeDropdown from "~/components/ui/ThemeDropdown.vue";
import LanguageSwitcher from "~/components/app/LanguageSwitcher.vue";
import { useElectron, type UpdateStatusPayload } from "~/composables/useElectron";
import "vue-sonner/style.css";
import { toast } from "vue-sonner";
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
const {
  isElectron,
  platformInfo,
  getPlatformInfo,
  installUpdate,
  onUpdateStatus,
} = useElectron();
let removeUpdateStatusListener: (() => void) | undefined;
let updateProgressToastId: string | number | undefined;

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
  { to: "/about", label: "about", hideInElectron: true },
  { to: "/downloads", label: "downloads", hideInElectron: true },
  { to: "/presets", label: "presets", requiresAuth: true },
];

const visibleNavLinks = computed(() => {
  return navLinks.filter((link) => !isElectron.value || !link.hideInElectron);
});

const showUpdateMessage = (payload: UpdateStatusPayload): void => {
  if (payload.status === "checking") {
    return;
  }

  if (payload.status === "available") {
    toast.info(t("updateAvailable"), {
      description: payload.version
        ? t("updateAvailableDescription", { version: payload.version })
        : t("updateAvailableDescriptionWithoutVersion"),
    });
    return;
  }

  if (payload.status === "not-available") {
    return;
  }

  if (payload.status === "download-progress") {
    const percent = payload.percent ?? 0;
    updateProgressToastId = toast.loading(t("updateDownloading"), {
      id: updateProgressToastId,
      description: t("updateDownloadProgress", { percent }),
    });
    return;
  }

  if (payload.status === "downloaded") {
    if (updateProgressToastId) {
      toast.dismiss(updateProgressToastId);
      updateProgressToastId = undefined;
    }

    toast.success(t("updateReady"), {
      description: payload.version
        ? t("updateReadyDescription", { version: payload.version })
        : t("updateReadyDescriptionWithoutVersion"),
      action: {
        label: t("restartToUpdate"),
        onClick: () => {
          void installUpdate();
        },
      },
    });
    return;
  }

  toast.error(t("updateFailed"), {
    description: payload.message || t("updateFailedDescription"),
  });
};

onMounted(() => {
  removeUpdateStatusListener = onUpdateStatus(showUpdateMessage);
});

onUnmounted(() => {
  removeUpdateStatusListener?.();
});
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
          <template v-for="link in visibleNavLinks" :key="link.to">
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
              <template v-for="link in visibleNavLinks" :key="link.to">
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
