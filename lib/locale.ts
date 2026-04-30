export type Locale = "ko" | "en" | "es"

export const SUPPORTED_LOCALES: readonly Locale[] = ["ko", "en", "es"] as const

export const LOCALE_COOKIE = "rk-locale"

// One year, matching common cookie defaults for non-sensitive preferences.
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  )
}

function tagToLocale(tag: string): Locale | null {
  // Normalize then take the primary language subtag (e.g. "es-MX" -> "es").
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0]
  if (primary === "ko") return "ko"
  if (primary === "es") return "es"
  if (primary === "en") return "en"
  return null
}

/**
 * Server-side default detection from the `Accept-Language` header.
 * Picks the highest-quality language tag whose primary subtag is one we support.
 * Falls back to "en" when no supported language is present.
 */
export function detectFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en"

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.split(";")
      let q = 1
      for (const param of params) {
        const match = /^\s*q=([\d.]+)\s*$/.exec(param)
        if (match) {
          const parsed = Number.parseFloat(match[1])
          if (Number.isFinite(parsed)) q = parsed
        }
      }
      return { tag: tag.trim(), q }
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of candidates) {
    const locale = tagToLocale(tag)
    if (locale) return locale
  }

  return "en"
}

/**
 * Client-side default detection from `navigator.language` /
 * `navigator.languages`. Mirrors `detectFromAcceptLanguage` semantics.
 */
export function detectFromNavigator(): Locale {
  if (typeof navigator === "undefined") return "en"

  const tags: string[] = []
  if (Array.isArray(navigator.languages)) tags.push(...navigator.languages)
  if (typeof navigator.language === "string") tags.push(navigator.language)

  for (const tag of tags) {
    const locale = tagToLocale(tag)
    if (locale) return locale
  }

  return "en"
}

/**
 * Parses the `rk-locale` cookie value and returns it if it matches a supported
 * locale, otherwise returns `null`.
 */
export function parseLocaleCookie(
  value: string | undefined | null
): Locale | null {
  if (!value) return null
  return isLocale(value) ? value : null
}
