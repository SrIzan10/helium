<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Download,
  Apple,
  Laptop,
  Info,
  ExternalLink,
} from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

const { t } = useI18n();

const platforms = [
  { name: "Windows", icon: Laptop, formats: "NSIS, Portable" },
  { name: "macOS", icon: Apple, formats: "DMG, ZIP" },
  { name: "Linux", icon: Laptop, formats: "AppImage" },
];
</script>

<template>
  <div class="container max-w-5xl mx-auto px-4 py-12">
    <div class="text-center space-y-4 mb-12">
      <h1 class="text-4xl font-bold tracking-tight">
        {{ t("downloadHelium") }}
      </h1>
      <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
        {{ t("downloadHeliumDescription") }}
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <Card class="relative overflow-hidden">
        <div
          class="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"
        >
          <Monitor class="w-32 h-32" />
        </div>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"
            >
              <Monitor class="w-5 h-5" />
            </div>
            <div>
              <CardTitle>{{ t("desktopApp") }}</CardTitle>
              <CardDescription>{{ t("desktopAppDescription") }}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-3">
            <div
              v-for="platform in platforms"
              :key="platform.name"
              class="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="platform.icon"
                  class="w-4 h-4 text-muted-foreground"
                />
                <span class="text-sm font-medium">{{ platform.name }}</span>
              </div>
              <Badge variant="secondary" class="text-xs">
                {{ platform.formats }}
              </Badge>
            </div>
          </div>
          <div
            class="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg"
          >
            <Info class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ t("desktopAppNote") }}</span>
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-3 items-stretch">
          <Button as-child class="w-full gap-2">
            <a
              href="https://github.com/SrIzan10/helium/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download class="w-4 h-4" />
              {{ t("downloadFromGitHub") }}
            </a>
          </Button>
          <Button as-child variant="outline" class="w-full gap-2">
            <a
              href="https://github.com/SrIzan10/helium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink class="w-4 h-4" />
              {{ t("viewSourceCode") }}
            </a>
          </Button>
        </CardFooter>
      </Card>

      <Card class="relative overflow-hidden">
        <div
          class="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"
        >
          <Smartphone class="w-32 h-32" />
        </div>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"
            >
              <Smartphone class="w-5 h-5" />
            </div>
            <div>
              <CardTitle>{{ t("androidApp") }}</CardTitle>
              <CardDescription>{{ t("androidAppDescription") }}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="p-3 rounded-lg bg-muted/50 space-y-2">
            <div class="flex items-center gap-3">
              <Smartphone class="w-4 h-4 text-muted-foreground" />
              <span class="text-sm font-medium">Android</span>
              <Badge variant="secondary" class="text-xs">APK</Badge>
            </div>
          </div>
          <div
            class="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg"
          >
            <Info class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ t("androidAppNote") }}</span>
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-3 items-stretch">
          <Button as-child class="w-full gap-2">
            <a
              href="https://github.com/SrIzan10/helium/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download class="w-4 h-4" />
              {{ t("downloadFromGitHub") }}
            </a>
          </Button>
          <Button as-child variant="outline" class="w-full gap-2">
            <a
              href="https://github.com/SrIzan10/helium/tree/main/native-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink class="w-4 h-4" />
              {{ t("viewSourceCode") }}
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>

  </div>
</template>
