"use client";

import { useState } from "react";

export const LOCALE_STORAGE_KEY = "anand-electricals-locale";
export const LOCALE_CHANGE_EVENT = "anand-electricals-locale-change";

type Locale = "en" | "hi";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "hi" ? "hi" : "en";
}

export function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>(readStoredLocale);

  function select(next: Locale) {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: next }));
  }

  return (
    <div className="flex items-center gap-3">
      <p>Language: {locale === "en" ? "English" : "Hindi"}</p>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Switch to English"
          aria-pressed={locale === "en"}
          onClick={() => select("en")}
          className="rounded-md border px-2 py-1 text-sm aria-pressed:bg-accent"
        >
          EN
        </button>
        <button
          type="button"
          aria-label="Switch to Hindi"
          aria-pressed={locale === "hi"}
          onClick={() => select("hi")}
          className="rounded-md border px-2 py-1 text-sm aria-pressed:bg-accent"
        >
          HI
        </button>
      </div>
    </div>
  );
}
