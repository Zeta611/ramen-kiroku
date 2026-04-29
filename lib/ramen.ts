export const RAMEN_STYLES = [
  "tonkotsu",
  "shoyu",
  "miso",
  "shio",
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
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  shoyu:
    "border-orange-600/30 bg-orange-600/10 text-orange-800 dark:text-orange-300",
  miso: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  shio: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  tsukemen:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  mazesoba:
    "border-lime-600/30 bg-lime-600/10 text-lime-800 dark:text-lime-300",
  abura_soba:
    "border-yellow-600/30 bg-yellow-600/10 text-yellow-800 dark:text-yellow-300",
  tantanmen:
    "border-rose-600/30 bg-rose-600/10 text-rose-800 dark:text-rose-300",
  iekei:
    "border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300",
  jiro: "border-fuchsia-600/30 bg-fuchsia-600/10 text-fuchsia-800 dark:text-fuchsia-300",
  other: "border-muted-foreground/30 bg-muted text-muted-foreground",
}

export const COUNTRIES = [
  { value: "KR", label: "Korea" },
  { value: "JP", label: "Japan" },
] as const

export type CountryCode = (typeof COUNTRIES)[number]["value"]

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
  country?: CountryCode
  city?: string
  area?: string
  sort: PlaceSort
}
