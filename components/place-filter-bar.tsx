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
  PLACE_SORT_OPTIONS,
  type CountryCode,
  type PlaceFilters,
  type PlaceSort,
} from "@/lib/ramen"

const ALL = "all"
const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function PlaceFilterBar({
  filters,
  onChange,
}: {
  filters: PlaceFilters
  onChange: (filters: PlaceFilters) => void
}) {
  const mounted = useMounted()
  const set = (patch: Partial<PlaceFilters>) =>
    onChange({ ...filters, ...patch })
  const clear = () => onChange({ sort: "name_asc" })

  if (!mounted) {
    return (
      <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border">
        <div className="grid gap-3 sm:flex sm:items-center sm:gap-4">
          <Input
            value=""
            onChange={() => {}}
            placeholder="Search shops, bowls, comments"
            disabled
            aria-label="Search visits"
            className="sm:max-w-xs sm:flex-1"
          />
          <div className="flex items-center gap-4 sm:ml-auto">
            <Button type="button" variant="outline" disabled>
              <RiFilter3Line />
              <span className="hidden sm:block">Filters</span>
            </Button>
          </div>
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
          onValueChange={(value) => set({ sort: value as PlaceSort })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLACE_SORT_OPTIONS.map((option) => (
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

      <Button type="button" variant="outline" onClick={clear}>
        <RiCloseLine data-icon="inline-start" />
        Clear filters
      </Button>
    </div>
  )

  return (
    <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border">
      <div className="grid gap-3 sm:flex sm:items-center sm:gap-4">
        <Input
          value={filters.q ?? ""}
          placeholder="Search shops, bowls, comments"
          onChange={(event) => set({ q: event.target.value || undefined })}
          aria-label="Search visits"
          className="sm:max-w-xs sm:flex-1"
        />
        <div className="flex items-center gap-4 sm:ml-auto">
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
            onValueChange={(value) => set({ sort: value as PlaceSort })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACE_SORT_OPTIONS.map((option) => (
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
