"use client"

import { useQuery } from "convex/react"
import * as React from "react"

import { FilterBar, type FeedFilters } from "@/components/filter-bar"
import {
  ShopMapBrowser,
  type MapBrowserShop,
} from "@/components/shop-map-browser"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { SAMPLE_SHOPS, SAMPLE_VISITS, usingSampleData } from "@/lib/sample-data"

type BrowseShop = {
  _id: Id<"shops">
  name: string
  nameJa?: string
  country: "JP" | "KR"
  city: string
  area: string
  lat?: number
  lng?: number
  visitCount: number
  latestPhoto?: { thumbUrl: string; width: number; height: number } | null
}

type DisplayShop = MapBrowserShop

function filterSampleShops(filters: FeedFilters) {
  return SAMPLE_SHOPS.filter((shop) => {
    if (filters.country && shop.country !== filters.country) return false
    if (filters.city && shop.city !== filters.city) return false
    if (filters.area && shop.area !== filters.area) return false

    const visits = SAMPLE_VISITS.filter((visit) => visit.shopId === shop._id)
    const hasVisitFilters =
      filters.style !== undefined ||
      filters.minRating !== undefined ||
      filters.maxRating !== undefined ||
      filters.fromDate !== undefined ||
      filters.toDate !== undefined ||
      filters.wouldRevisit !== undefined

    if (!hasVisitFilters) return true

    return visits.some((visit) => {
      if (filters.style && visit.style !== filters.style) return false
      if (
        filters.minRating !== undefined &&
        visit.ratingOverall < filters.minRating
      )
        return false
      if (
        filters.maxRating !== undefined &&
        visit.ratingOverall > filters.maxRating
      )
        return false
      if (filters.fromDate && visit.visitedOn < filters.fromDate) return false
      if (filters.toDate && visit.visitedOn > filters.toDate) return false
      if (
        filters.wouldRevisit !== undefined &&
        visit.wouldRevisit !== filters.wouldRevisit
      )
        return false
      return true
    })
  })
    .map((shop): DisplayShop => {
      const visits = SAMPLE_VISITS.filter((visit) => visit.shopId === shop._id)
      return {
        ...shop,
        lat: undefined,
        lng: undefined,
        visitCount: visits.length,
        latestPhoto: visits[0]?.firstPhoto ?? null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function MapPage() {
  const [filters, setFilters] = React.useState<FeedFilters>({
    country: "KR",
    sort: "visitedOn_desc",
  })
  const showSamples = usingSampleData()
  const shops = useQuery(api.shops.browse, showSamples ? "skip" : filters)
  const realShops = shops as BrowseShop[] | undefined
  const displayShops: DisplayShop[] | undefined = showSamples
    ? filterSampleShops(filters)
    : realShops
  const selectedCountry = filters.country ?? "KR"

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
      <FilterBar filters={filters} onChange={setFilters} />
      <ShopMapBrowser
        title="Map"
        shops={displayShops}
        selectedCountry={selectedCountry}
        showSamples={showSamples}
        sampleNotice={
          showSamples
            ? "Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured."
            : undefined
        }
        listTitle="Shops"
        loadingLabel="Loading shops"
        emptyLabel="No shops match these filters."
        mapEmptyLabel="No shops match these filters."
        summaryLabel={(shopCount, markerCount, missingCoords) =>
          shopCount === undefined
            ? "Loading shops"
            : `${markerCount} shown on map${
                missingCoords > 0
                  ? ` · ${missingCoords} missing coordinates`
                  : ""
              }`
        }
      />
    </main>
  )
}
