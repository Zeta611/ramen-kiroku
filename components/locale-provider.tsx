"use client"

import * as React from "react"

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  type Locale,
} from "@/lib/locale"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return
  document.cookie = [
    `${LOCALE_COOKIE}=${encodeURIComponent(locale)}`,
    "path=/",
    `max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    "samesite=lax",
  ].join("; ")
}

export function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initial)

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
    writeLocaleCookie(next)
    if (typeof document !== "undefined") {
      document.documentElement.lang = next
    }
  }, [])

  const value = React.useMemo<LocaleContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider>")
  }
  return ctx
}
