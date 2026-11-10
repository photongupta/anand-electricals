"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import { LOCALE_CHANGE_EVENT, LOCALE_STORAGE_KEY } from "@/components/layout/LanguageToggle";

type Locale = "en" | "hi";
const messagesByLocale = { en: enMessages, hi: hiMessages };

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "hi") setLocale("hi");

    function handleLocaleChange(event: Event) {
      const next = (event as CustomEvent<Locale>).detail;
      setLocale(next);
    }
    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messagesByLocale[locale]}
      timeZone="Asia/Kolkata"
    >
      {children}
    </NextIntlClientProvider>
  );
}
