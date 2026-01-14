import { updateClerkOptions } from "#imports";
import { esES } from "@clerk/localizations";
import { shadcn } from "@clerk/themes";

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as any;

  if (!i18n) return;

  nuxtApp.hook("app:mounted", () => {
    const checkClerk = () => {
      try {
        const testUpdate = () => {
          updateClerkOptions({
            localization: i18n.locale.value === "es" ? esES : undefined,
            appearance: {
              theme: shadcn,
            },
          });
        };

        testUpdate();

        watch(
          () => i18n.locale.value,
          (newLocale) => {
            const clerkLocale = newLocale === "es" ? esES : undefined;

            updateClerkOptions({
              localization: clerkLocale,
              appearance: {
                theme: shadcn,
              },
            });
          },
        );
      } catch (e) {
        setTimeout(checkClerk, 100);
      }
    };

    checkClerk();
  });
});
