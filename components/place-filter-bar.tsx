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
  const clear = () => onChange({ country: "KR", sort: "name_asc" })

  if (!mounted) {
    return (
      <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Browse
            </p>
            <p className="truncate text-sm">Filter by place</p>
          </div>
          <Button type="button" variant="outline" disabled>
            <RiFilter3Line data-icon="inline-start" />
            Filters
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Browse
          </p>
          <p className="truncate text-sm">Filter by place</p>
        </div>
        <div className="hidden min-w-[220px] sm:block">
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
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline">
              <RiFilter3Line data-icon="inline-start" />
              Filters
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
  )
}
