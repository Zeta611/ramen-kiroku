export const RAMEN_STYLES = [
  "tonkotsu",
  "shoyu",
  "miso",
  "shio",
  "niboshi",
  "tsukemen",
  "mazesoba",
  "abura_soba",
  "tantanmen",
  "iekei",
  "jiro",
  "other",
] as const

export type RamenStyle = (typeof RAMEN_STYLES)[number]

export const STYLE_LABELS: Record<RamenStyle, string> = {
  tonkotsu: "Tonkotsu",
  shoyu: "Shoyu",
  miso: "Miso",
  shio: "Shio",
  niboshi: "Niboshi",
  tsukemen: "Tsukemen",
  mazesoba: "Mazesoba",
  abura_soba: "Abura-soba",
  tantanmen: "Tantanmen",
  iekei: "Iekei",
  jiro: "Jiro",
  other: "Other",
}

export const STYLE_CHIP_CLASSES: Record<RamenStyle, string> = {
  tonkotsu:
    "border-stone-500/30 bg-stone-500/10 text-stone-700 dark:text-stone-300",
  shoyu:
    "border-amber-800/30 bg-amber-800/10 text-amber-900 dark:text-amber-200",
  miso: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  shio: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  niboshi:
    "border-green-700/30 bg-green-700/10 text-green-900 dark:text-green-300",
  tsukemen:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  mazesoba:
    "border-teal-600/30 bg-teal-600/10 text-teal-800 dark:text-teal-300",
  abura_soba:
    "border-yellow-600/30 bg-yellow-600/10 text-yellow-800 dark:text-yellow-300",
  tantanmen:
    "border-rose-600/30 bg-rose-600/10 text-rose-800 dark:text-rose-300",
  iekei:
    "border-orange-600/30 bg-orange-600/10 text-orange-800 dark:text-orange-300",
  jiro: "border-fuchsia-600/30 bg-fuchsia-600/10 text-fuchsia-800 dark:text-fuchsia-300",
  other: "border-muted-foreground/30 bg-muted text-muted-foreground",
}

export const NOODLE_FIRMNESS_OPTIONS = [
  { value: "barikata", label: "Very firm (barikata)" },
  { value: "katame", label: "Firm (katame)" },
  { value: "futsuu", label: "Regular (futsuu)" },
  { value: "yawarakame", label: "Soft (yawarakame)" },
] as const

export const NOODLE_THICKNESS_OPTIONS = [
  { value: "thin", label: "Thin" },
  { value: "medium", label: "Medium" },
  { value: "thick", label: "Thick" },
  { value: "extra thick", label: "Extra thick" },
] as const

const NOODLE_FIRMNESS_LABELS = new Map<string, string>(
  NOODLE_FIRMNESS_OPTIONS.map((option) => [option.value, option.label])
)

const NOODLE_THICKNESS_LABELS = new Map<string, string>(
  NOODLE_THICKNESS_OPTIONS.map((option) => [option.value, option.label])
)

// Resolves a stored noodle value (e.g. "katame", "thin") to its display label.
// Falls back to the raw value so legacy/custom strings still render sensibly.
export function noodleFirmnessLabel(value: string) {
  return NOODLE_FIRMNESS_LABELS.get(value) ?? value
}

export function noodleThicknessLabel(value: string) {
  return NOODLE_THICKNESS_LABELS.get(value) ?? value
}

export const COUNTRIES = [
  { value: "KR", label: "Korea" },
  { value: "JP", label: "Japan" },
] as const

export type CountryCode = (typeof COUNTRIES)[number]["value"]

export const COUNTRY_BAR_OPTIONS = [
  {
    value: "KR",
    label: "South Korea",
    flag: "🇰🇷",
    ariaLabel: "Filter to South Korea",
  },
  {
    value: "JP",
    label: "Japan",
    flag: "🇯🇵",
    ariaLabel: "Filter to Japan",
  },
] as const

export type CountryBarOption = (typeof COUNTRY_BAR_OPTIONS)[number]

export const SORT_OPTIONS = [
  { value: "visitedOn_desc", label: "Newest visits" },
  { value: "visitedOn_asc", label: "Oldest visits" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "rating_asc", label: "Lowest rated" },
  { value: "created_desc", label: "Recently added" },
] as const

export type VisitSort = (typeof SORT_OPTIONS)[number]["value"]

export const PLACE_SORT_OPTIONS = [
  { value: "name_asc", label: "Name" },
  { value: "created_desc", label: "Recently added" },
] as const

export type PlaceSort = (typeof PLACE_SORT_OPTIONS)[number]["value"]

export type PlaceFilters = {
  q?: string
  country?: CountryCode
  city?: string
  area?: string
  sort: PlaceSort
}
