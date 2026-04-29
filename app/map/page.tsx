"use client"

import { useQuery } from "convex/react"
import * as React from "react"

import { api } from "@/convex/_generated/api"
import { NaverMap, type NaverMapMarker } from "@/components/naver-map"
import { usingSampleData } from "@/lib/sample-data"

export default function MapPage() {
  const showSamples = usingSampleData()
  const shops = useQuery(
    api.shops.list,
    showSamples ? "skip" : { country: "KR" }
  )

  const markers = React.useMemo<NaverMapMarker[]>(() => {
    if (!shops) return []
    const result: NaverMapMarker[] = []
    for (const shop of shops) {
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
  }, [shops])

  const totalKrShops = shops?.length ?? 0
  const missingCoords = totalKrShops - markers.length

  return (
    <main className="mx-auto grid max-w-6xl gap-3 px-4 py-4">
      <div>
        <h1 className="font-heading text-4xl">Map</h1>
        <p className="text-sm text-muted-foreground">
          {showSamples
            ? "Sample mode — connect Convex to see real shops on the map."
            : `${markers.length} Korean shop${markers.length === 1 ? "" : "s"} on the map${
                missingCoords > 0 ? ` · ${missingCoords} missing lat/lng` : ""
              }`}
        </p>
      </div>

      {showSamples ? (
        <div className="border border-dashed p-3 text-xs text-muted-foreground">
          Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured.
        </div>
      ) : shops === undefined ? (
        <div className="flex h-[60vh] w-full items-center justify-center border border-dashed text-sm text-muted-foreground">
          Loading shops
        </div>
      ) : markers.length === 0 ? (
        <div className="flex h-[60vh] w-full items-center justify-center border border-dashed px-6 text-center text-sm text-muted-foreground">
          No Korean shops with coordinates yet — open a shop, hit Edit, fill the
          address, and click Geocode to populate lat/lng.
        </div>
      ) : (
        <NaverMap markers={markers} className="h-[70vh] w-full border" />
      )}
    </main>
  )
}
