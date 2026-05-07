"use client"

import * as React from "react"

import { GoogleMap, type GoogleMapMarker } from "@/components/google-map"
import { NaverMap, type NaverMapMarker } from "@/components/naver-map"
import { ShopCard } from "@/components/shop-card"
import type { Id } from "@/convex/_generated/dataModel"

export type MapBrowserShop = {
  _id: string
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

function MapState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[52vh] min-h-80 w-full items-center justify-center border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground lg:h-[70vh]">
      {children}
    </div>
  )
}

export function ShopMapBrowser({
  title,
  shops,
  selectedCountry,
  showSamples,
  sampleNotice,
  listTitle,
  loadingLabel,
  emptyLabel,
  mapEmptyLabel,
  missingCoordinatesLabels,
  summaryLabel,
  listSummaryLabel,
  titleAction,
  action,
}: {
  title: string
  shops: MapBrowserShop[] | undefined
  selectedCountry: "JP" | "KR"
  showSamples: boolean
  sampleNotice?: string
  listTitle: string
  loadingLabel: string
  emptyLabel: string
  mapEmptyLabel: string
  missingCoordinatesLabels?: {
    JP: string
    KR: string
  }
  summaryLabel: (
    shopCount: number | undefined,
    markerCount: number,
    missingCoords: number
  ) => string
  listSummaryLabel?: (shopCount: number | undefined) => string
  titleAction?: React.ReactNode
  action?: (shop: MapBrowserShop) => React.ReactNode
}) {
  const naverMarkers = React.useMemo<NaverMapMarker[]>(() => {
    if (!shops || selectedCountry !== "KR" || showSamples) return []

    const result: NaverMapMarker[] = []
    for (const shop of shops) {
      if (shop.country !== "KR" || shop.lat == null || shop.lng == null)
        continue
      result.push({
        shopId: shop._id as Id<"shops">,
        name: shop.name,
        nameJa: shop.nameJa,
        lat: shop.lat,
        lng: shop.lng,
      })
    }
    return result
  }, [shops, selectedCountry, showSamples])

  const googleMarkers = React.useMemo<GoogleMapMarker[]>(() => {
    if (!shops || selectedCountry !== "JP" || showSamples) return []

    const result: GoogleMapMarker[] = []
    for (const shop of shops) {
      if (shop.country !== "JP" || shop.lat == null || shop.lng == null)
        continue
      result.push({
        shopId: shop._id as Id<"shops">,
        name: shop.name,
        nameJa: shop.nameJa,
        lat: shop.lat,
        lng: shop.lng,
      })
    }
    return result
  }, [shops, selectedCountry, showSamples])

  const activeMarkers = selectedCountry === "JP" ? googleMarkers : naverMarkers
  const missingCoords =
    shops && !showSamples ? shops.length - activeMarkers.length : 0
  const mapSummary = summaryLabel(
    shops?.length,
    activeMarkers.length,
    missingCoords
  )
  const missingLabel =
    missingCoordinatesLabels?.[selectedCountry] ??
    (selectedCountry === "JP"
      ? "Matching Japan shops do not have coordinates yet. Use Geocode on each shop edit page."
      : "Matching Korean shops do not have coordinates yet. Add lat/lng from each shop edit page to place them on the map.")

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{mapSummary}</p>
        </div>
        {titleAction}
      </div>

      {sampleNotice ? (
        <div className="border border-dashed p-3 text-xs text-muted-foreground">
          {sampleNotice}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] lg:items-start">
        <div>
          {shops === undefined ? (
            <MapState>{loadingLabel}</MapState>
          ) : shops.length === 0 ? (
            <MapState>{mapEmptyLabel}</MapState>
          ) : showSamples ? (
            <MapState>
              Sample shops do not include coordinates. Shops are listed
              alongside the map.
            </MapState>
          ) : activeMarkers.length === 0 ? (
            <MapState>{missingLabel}</MapState>
          ) : selectedCountry === "JP" ? (
            <GoogleMap
              markers={googleMarkers}
              className="h-[52vh] lg:h-[70vh]"
            />
          ) : (
            <NaverMap markers={naverMarkers} className="h-[52vh] lg:h-[70vh]" />
          )}
        </div>

        <div className="grid gap-3 lg:h-[70vh] lg:grid-rows-[auto_minmax(0,1fr)]">
          <div>
            <h2 className="font-heading text-2xl">{listTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {listSummaryLabel
                ? listSummaryLabel(shops?.length)
                : shops === undefined
                  ? loadingLabel
                  : `${shops.length} matching shop${shops.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {shops === undefined ? (
            <div className="border border-dashed p-8 text-sm text-muted-foreground">
              {loadingLabel}
            </div>
          ) : shops.length === 0 ? (
            <div className="border border-dashed p-8 text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          ) : (
            <div className="flex max-h-none flex-col gap-3 overflow-y-visible lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              {shops.map((shop) => (
                <ShopCard key={shop._id} shop={shop} action={action?.(shop)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
