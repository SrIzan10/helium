import { updateClerkOptions } from "#imports";
import { esES } from "@clerk/localizations";
import { shadcn } from "@clerk/themes";
import type { Ref } from "vue";

interface ClerkLocaleOptions {
  localization: typeof esES | undefined;
  appearance: {
    theme: typeof shadcn;
  };
}

interface I18nRuntime {
  locale: Ref<string>;
}

interface MutablePublicConfig {
  clerk?: Record<string, unknown>;
}

function getClerkLocaleOptions(locale: string): ClerkLocaleOptions {
  return {
    localization: locale === "es" ? esES : undefined,
    appearance: {
      theme: shadcn,
    },
  };
}

function getCookieValue(name: string): string | undefined {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : undefined;
}

function getInitialLocale(): string {
  const cookieLocale = getCookieValue("i18n_locale");
  if (cookieLocale) return cookieLocale;

  if (navigator.language.toLowerCase().startsWith("es")) {
    return "es";
  }

  return "en";
}

export default defineNuxtPlugin({
  name: "clerk-locale",
  enforce: "pre",
  setup(nuxtApp) {
    const runtimeConfig = useRuntimeConfig();
    const clerkLocaleVersion = useState("clerk-locale-version", () => 0);
    const publicConfig = runtimeConfig.public as MutablePublicConfig;
    const initialLocale = getInitialLocale();

    function updateRuntimeConfig(options: ClerkLocaleOptions): void {
      publicConfig.clerk = {
        ...(publicConfig.clerk ?? {}),
        ...options,
      };
    }

    updateRuntimeConfig(getClerkLocaleOptions(initialLocale));

    function updateLocale(locale: string, attempts = 0): void {
      const options = getClerkLocaleOptions(locale);

      updateRuntimeConfig(options);

      try {
        updateClerkOptions(options);
        clerkLocaleVersion.value += 1;
      } catch {
        if (attempts < 20) {
          setTimeout(() => updateLocale(locale, attempts + 1), 100);
        }
      }
    }

    nuxtApp.hook("i18n:beforeLocaleSwitch", (options) => {
      updateLocale(options.newLocale);
    });

    nuxtApp.hook("i18n:localeSwitched", (options) => {
      updateLocale(options.newLocale);
    });

    nuxtApp.hook("app:mounted", () => {
      const i18n = nuxtApp.$i18n as I18nRuntime | undefined;
      if (!i18n) {
        updateLocale(initialLocale);
        return;
      }

      watch(
        () => i18n.locale.value,
        (locale) => {
          updateLocale(locale);
        },
        { immediate: true },
      );
    });
  },
});
