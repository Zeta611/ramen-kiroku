"use client"

import { useLocale } from "@/components/locale-provider"
import type { Locale } from "@/lib/locale"

type TranslationStatus = "pending" | "error"

const STATUS_HINTS: Record<
  Exclude<Locale, "ko">,
  Record<TranslationStatus, string>
> = {
  en: {
    pending: "Translating…",
    error: "Translation unavailable — showing original",
  },
  es: {
    pending: "Traduciendo…",
    error: "Traducción no disponible — mostrando original",
  },
}

export function TranslatedComment({
  ko,
  en,
  es,
  status,
}: {
  ko: string
  en?: string
  es?: string
  status?: TranslationStatus
}) {
  const { locale } = useLocale()

  const trimmed = ko.trim()
  if (!trimmed) {
    return <p className="text-sm leading-7 whitespace-pre-wrap">No notes.</p>
  }

  if (locale === "ko") {
    return (
      <p lang="ko" className="text-sm leading-7 whitespace-pre-wrap">
        {ko}
      </p>
    )
  }

  const translated = locale === "en" ? en : es
  if (translated) {
    return (
      <p lang={locale} className="text-sm leading-7 whitespace-pre-wrap">
        {translated}
      </p>
    )
  }

  // No translation yet — fall back to KO with a small status hint.
  const effectiveStatus: TranslationStatus = status ?? "pending"
  const hint = STATUS_HINTS[locale][effectiveStatus]

  return (
    <div className="grid gap-2">
      <p
        className="text-xs tracking-wide text-muted-foreground italic"
        aria-live="polite"
      >
        {hint}
      </p>
      <p lang="ko" className="text-sm leading-7 whitespace-pre-wrap">
        {ko}
      </p>
    </div>
  )
}
