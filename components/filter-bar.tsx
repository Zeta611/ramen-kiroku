"use client"

import { RiCloseLine, RiFilter3Line } from "@remixicon/react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  COUNTRIES,
  COUNTRY_BAR_OPTIONS,
  RAMEN_STYLES,
  SORT_OPTIONS,
  STYLE_LABELS,
  type CountryCode,
  type RamenStyle,
  type VisitSort,
} from "@/lib/ramen"

export type FeedFilters = {
  country?: CountryCode
  city?: string
  area?: string
  style?: RamenStyle
  minRating?: number
  maxRating?: number
  fromDate?: string
  toDate?: string
  wouldRevisit?: boolean
  sort: VisitSort
}

const ALL = "all"
const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FeedFilters
  onChange: (filters: FeedFilters) => void
}) {
  const mounted = useMounted()
  const set = (patch: Partial<FeedFilters>) =>
    onChange({ ...filters, ...patch })
  const clear = () => onChange({ sort: "visitedOn_desc" })

  if (!mounted) {
    return (
      <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Browse
            </p>
            <p className="hidden truncate text-sm sm:block">
              Filter by style, place, date, rating
            </p>
          </div>
          <Button type="button" variant="outline" disabled>
            <RiFilter3Line />
            <span className="hidden sm:block">Filters</span>
          </Button>
        </div>
      </div>
    )
  }

  const controls = (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Sort
        </label>
        <Select
          value={filters.sort}
          onValueChange={(value) => set({ sort: value as VisitSort })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Country
        </label>
        <Select
          value={filters.country ?? ALL}
          onValueChange={(value) =>
            set({ country: value === ALL ? undefined : (value as CountryCode) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All countries</SelectItem>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Style
        </label>
        <Select
          value={filters.style ?? ALL}
          onValueChange={(value) =>
            set({ style: value === ALL ? undefined : (value as RamenStyle) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All styles</SelectItem>
            {RAMEN_STYLES.map((style) => (
              <SelectItem key={style} value={style}>
                {STYLE_LABELS[style]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            City
          </label>
          <Input
            value={filters.city ?? ""}
            placeholder="Tokyo"
            onChange={(event) => set({ city: event.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Area
          </label>
          <Input
            value={filters.area ?? ""}
            placeholder="Hongdae"
            onChange={(event) => set({ area: event.target.value || undefined })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Min rating
          </label>
          <Input
            type="number"
            min="1"
            max="5"
            value={filters.minRating ?? ""}
            onChange={(event) =>
              set({
                minRating: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Max rating
          </label>
          <Input
            type="number"
            min="1"
            max="5"
            value={filters.maxRating ?? ""}
            onChange={(event) =>
              set({
                maxRating: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            From
          </label>
          <Input
            type="date"
            value={filters.fromDate ?? ""}
            onChange={(event) =>
              set({ fromDate: event.target.value || undefined })
            }
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            To
          </label>
          <Input
            type="date"
            value={filters.toDate ?? ""}
            onChange={(event) =>
              set({ toDate: event.target.value || undefined })
            }
          />
        </div>
      </div>

      <Select
        value={
          filters.wouldRevisit === undefined
            ? ALL
            : filters.wouldRevisit
              ? "yes"
              : "no"
        }
        onValueChange={(value) =>
          set({ wouldRevisit: value === ALL ? undefined : value === "yes" })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All revisit statuses</SelectItem>
          <SelectItem value="yes">Would revisit</SelectItem>
          <SelectItem value="no">Would not revisit</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" onClick={clear}>
        <RiCloseLine />
        Clear filters
      </Button>
    </div>
  )

  return (
    <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Browse
          </p>
          <p className="hidden truncate text-sm sm:block">
            Filter by style, place, date, rating
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-0.5"
            role="group"
            aria-label="Filter by country"
          >
            {COUNTRY_BAR_OPTIONS.map((option) => {
              const isSelected = filters.country === option.value
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className={
                    isSelected ? "bg-muted text-foreground" : undefined
                  }
                  aria-pressed={isSelected}
                  title={option.ariaLabel}
                  aria-label={option.ariaLabel}
                  onClick={() =>
                    set({
                      country: isSelected ? undefined : option.value,
                    })
                  }
                >
                  <span className="text-base leading-none" aria-hidden>
                    {option.flag}
                  </span>
                </Button>
              )
            })}
          </div>
          <Select
            value={filters.sort}
            onValueChange={(value) => set({ sort: value as VisitSort })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline">
                <RiFilter3Line />
                <span className="hidden sm:block">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{controls}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
