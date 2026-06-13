<script setup lang="ts">
import type { Component } from "vue";

import {
  Apple,
  Download,
  ExternalLink,
  Info,
  Laptop,
  Monitor,
  Smartphone,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

definePageMeta({
  layout: "default",
});

interface PlatformDownload {
  name: string;
  icon: Component;
  formats: string;
  href: string;
}

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  html_url: string;
  assets: GitHubReleaseAsset[];
}

const { t } = useI18n();

const repositoryUrl = "https://github.com/SrIzan10/helium";
const releasesUrl = `${repositoryUrl}/releases`;
const latestReleaseFallbackUrl = `${releasesUrl}/latest`;
const latestReleaseApiUrl =
  "https://api.github.com/repos/SrIzan10/helium/releases/latest";
const androidSourceUrl = `${repositoryUrl}/tree/main/native-app`;

const { data: latestRelease } = useFetch<GitHubRelease>(latestReleaseApiUrl, {
  key: "helium-latest-release",
  server: false,
  default: () => ({
    html_url: latestReleaseFallbackUrl,
    assets: [],
  }),
});

const latestReleaseUrl = computed<string>(() => {
  return latestRelease.value?.html_url ?? latestReleaseFallbackUrl;
});

const releaseAssets = computed<GitHubReleaseAsset[]>(() => {
  return latestRelease.value?.assets ?? [];
});

function findReleaseAsset(
  patterns: readonly RegExp[],
): GitHubReleaseAsset | undefined {
  return releaseAssets.value.find((asset) => {
    return patterns.some((pattern) => pattern.test(asset.name));
  });
}

function getReleaseAssetUrl(patterns: readonly RegExp[]): string {
  return findReleaseAsset(patterns)?.browser_download_url ?? latestReleaseUrl.value;
}

const desktopPlatforms = computed<PlatformDownload[]>(() => {
  return [
    {
      name: "Windows",
      icon: Laptop,
      formats: "NSIS, Portable",
      href: getReleaseAssetUrl([/-Setup-.*\.exe$/i, /\.exe$/i]),
    },
    {
      name: "macOS",
      icon: Apple,
      formats: "DMG, ZIP",
      href: getReleaseAssetUrl([/\.dmg$/i, /-mac\.zip$/i]),
    },
    {
      name: "Linux",
      icon: Laptop,
      formats: "AppImage",
      href: getReleaseAssetUrl([/\.AppImage$/i]),
    },
  ];
});

const androidPlatform = computed<PlatformDownload>(() => {
  return {
    name: "Android",
    icon: Smartphone,
    formats: "APK",
    href: getReleaseAssetUrl([/^helium-android-.*\.apk$/i]),
  };
});
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
      <Card class="relative h-full overflow-hidden">
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
              <CardDescription>
                {{ t("desktopAppDescription") }}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex-1 space-y-4">
          <div class="space-y-3">
            <div
              v-for="platform in desktopPlatforms"
              :key="platform.name"
            >
              <a
                :href="platform.href"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div class="flex items-center gap-3">
                  <component
                    :is="platform.icon"
                    class="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                  <span class="text-sm font-medium">{{ platform.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">
                    {{ platform.formats }}
                  </Badge>
                  <Download
                    class="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </div>
              </a>
            </div>
          </div>
          <div
            class="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg"
          >
            <Info class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ t("desktopAppNote") }}</span>
          </div>
        </CardContent>
        <CardFooter class="mt-auto flex-col gap-3 items-stretch">
          <Button as-child class="w-full gap-2">
            <a
              :href="latestReleaseUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download class="w-4 h-4" />
              {{ t("downloadFromGitHub") }}
            </a>
          </Button>
          <Button as-child variant="outline" class="w-full gap-2">
            <a
              :href="repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink class="w-4 h-4" />
              {{ t("viewSourceCode") }}
            </a>
          </Button>
        </CardFooter>
      </Card>

      <Card class="relative h-full overflow-hidden">
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
              <CardDescription>
                {{ t("androidAppDescription") }}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex-1 space-y-4">
          <div>
            <a
              :href="androidPlatform.href"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="androidPlatform.icon"
                  class="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground"
                />
                <span class="text-sm font-medium">
                  {{ androidPlatform.name }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-xs">
                  {{ androidPlatform.formats }}
                </Badge>
                <Download
                  class="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground"
                />
              </div>
            </a>
          </div>
          <div
            class="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg"
          >
            <Info class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ t("androidAppNote") }}</span>
          </div>
        </CardContent>
        <CardFooter class="mt-auto flex-col gap-3 items-stretch">
          <Button as-child class="w-full gap-2">
            <a
              :href="androidPlatform.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download class="w-4 h-4" />
              {{ t("downloadFromGitHub") }}
            </a>
          </Button>
          <Button as-child variant="outline" class="w-full gap-2">
            <a
              :href="androidSourceUrl"
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
