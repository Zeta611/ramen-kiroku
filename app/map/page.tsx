"use client"

import { useQuery } from "convex/react"
import * as React from "react"

import { FilterBar, type FeedFilters } from "@/components/filter-bar"
import { GoogleMap, type GoogleMapMarker } from "@/components/google-map"
import { NaverMap, type NaverMapMarker } from "@/components/naver-map"
import { ShopCard } from "@/components/shop-card"
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

type DisplayShop = Omit<BrowseShop, "_id"> & {
  _id: string
}

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

function MapState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[52vh] min-h-80 w-full items-center justify-center border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground lg:h-[70vh]">
      {children}
    </div>
  )
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

  const naverMarkers = React.useMemo<NaverMapMarker[]>(() => {
    if (!realShops || selectedCountry !== "KR" || showSamples) return []

    const result: NaverMapMarker[] = []
    for (const shop of realShops) {
      if (shop.lat == null || shop.lng == null) continue
      result.push({
        shopId: shop._id,
        name: shop.name,
        nameJa: shop.nameJa,
        lat: shop.lat,
        lng: shop.lng,
      })
    }
    return result
  }, [realShops, selectedCountry, showSamples])

  const googleMarkers = React.useMemo<GoogleMapMarker[]>(() => {
    if (!realShops || selectedCountry !== "JP" || showSamples) return []

    const result: GoogleMapMarker[] = []
    for (const shop of realShops) {
      if (shop.lat == null || shop.lng == null) continue
      result.push({
        shopId: shop._id,
        name: shop.name,
        nameJa: shop.nameJa,
        lat: shop.lat,
        lng: shop.lng,
      })
    }
    return result
  }, [realShops, selectedCountry, showSamples])

  const activeMarkers =
    selectedCountry === "JP" ? googleMarkers : naverMarkers
  const missingCoords =
    displayShops && !showSamples
      ? displayShops.length - activeMarkers.length
      : 0

  const mapSummary =
    displayShops === undefined
        ? "Loading shops"
        : `${activeMarkers.length} shown on map${
            missingCoords > 0 ? ` · ${missingCoords} missing coordinates` : ""
          }`

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
      <FilterBar filters={filters} onChange={setFilters} />
      <div>
        <h1 className="font-heading text-4xl">Map</h1>
        <p className="text-sm text-muted-foreground">{mapSummary}</p>
      </div>

      {showSamples ? (
        <div className="border border-dashed p-3 text-xs text-muted-foreground">
          Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] lg:items-start">
        <div>
          {displayShops === undefined ? (
            <MapState>Loading shops</MapState>
          ) : displayShops.length === 0 ? (
            <MapState>No shops match these filters.</MapState>
          ) : showSamples ? (
            <MapState>
              Sample shops do not include coordinates. Shops are listed
              alongside the map.
            </MapState>
          ) : activeMarkers.length === 0 ? (
            <MapState>
              {selectedCountry === "JP"
                ? "Matching Japan shops do not have coordinates yet. Use Geocode on each shop edit page."
                : "Matching Korean shops do not have coordinates yet. Add lat/lng from each shop edit page to place them on the map."}
            </MapState>
          ) : selectedCountry === "JP" ? (
            <GoogleMap
              markers={googleMarkers}
              className="h-[52vh] lg:h-[70vh]"
            />
          ) : (
            <NaverMap
              markers={naverMarkers}
              className="h-[52vh] lg:h-[70vh]"
            />
          )}
        </div>

        <div className="grid gap-3">
          <div>
            <h2 className="font-heading text-2xl">Shops</h2>
            <p className="text-sm text-muted-foreground">
              {displayShops === undefined
                ? "Loading shops"
                : `${displayShops.length} matching shop${
                    displayShops.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {displayShops === undefined ? (
            <div className="border border-dashed p-8 text-sm text-muted-foreground">
              Loading shops
            </div>
          ) : displayShops.length === 0 ? (
            <div className="border border-dashed p-8 text-sm text-muted-foreground">
              No shops match these filters.
            </div>
          ) : (
            <div className="grid max-h-none gap-3 overflow-y-visible lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
              {displayShops.map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
