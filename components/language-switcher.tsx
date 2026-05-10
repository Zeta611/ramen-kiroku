"use client"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/components/locale-provider"
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale"
import { cn } from "@/lib/utils"

const LABELS: Record<Locale, string> = {
  ko: "KO",
  en: "EN",
  es: "ES",
}

const FLAGS: Record<Locale, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  es: "🇲🇽",
}

const FULL_NAMES: Record<Locale, string> = {
  ko: "한국어 (original)",
  en: "English",
  es: "Español (México)",
}

export function LanguageSwitcher({
  size = "sm",
  className,
}: {
  size?: "xs" | "sm"
  className?: string
}) {
  const { locale, setLocale } = useLocale()

  return (
    <div
      role="group"
      aria-label="Choose comment language"
      className={cn("flex items-center gap-0.5", className)}
    >
      {SUPPORTED_LOCALES.map((value) => {
        const isSelected = locale === value
        return (
          <Button
            key={value}
            type="button"
            size={size}
            variant="ghost"
            className={isSelected ? "bg-muted text-foreground" : undefined}
            aria-pressed={isSelected}
            title={FULL_NAMES[value]}
            onClick={() => setLocale(value)}
          >
            {LABELS[value]}
            <span aria-hidden>{FLAGS[value]}</span>
          </Button>
        )
      })}
    </div>
  )
}
