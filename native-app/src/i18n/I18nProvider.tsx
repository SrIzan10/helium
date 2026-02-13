import { createContext, useContext, useMemo } from "react";

import { messages, type Locale, type MessageKey } from "./messages";

interface I18nContextValue {
  locale: Locale;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveLocale(): Locale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("es") ? "es" : "en";
}

function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages.en[key] ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [paramKey, value]) => {
    return result.replaceAll(`{${paramKey}}`, String(value));
  }, template);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = resolveLocale();

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
