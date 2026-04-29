"use client"

import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
} from "@vis.gl/react-google-maps"
import { useRouter } from "next/navigation"
import * as React from "react"

import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export type GoogleMapMarker = {
  shopId: Id<"shops">
  name: string
  nameJa?: string
  lat: number
  lng: number
}

function GoogleShopMarker({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap font-sans">
      <span className="block size-3.5 rounded-full border-[3px] border-white bg-blue-600 shadow-[0_1px_4px_rgba(0,0,0,.35)]" />
      <span className="block max-w-40 overflow-hidden rounded border border-black/15 bg-white px-2 py-1 text-xs leading-tight font-bold text-neutral-900 shadow-[0_1px_5px_rgba(0,0,0,.24)]">
        {name}
      </span>
    </div>
  )
}

function GoogleMapCamera({
  markers,
  zoom,
}: {
  markers: GoogleMapMarker[]
  zoom: number
}) {
  const map = useMap()

  React.useEffect(() => {
    if (!map || markers.length === 0) return

    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng })
      map.setZoom(zoom)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    for (const marker of markers) {
      bounds.extend({ lat: marker.lat, lng: marker.lng })
    }
    map.fitBounds(bounds, 48)
  }, [map, markers, zoom])

  return null
}

export function GoogleMap({
  markers,
  zoom = 15,
  className,
}: {
  markers: GoogleMapMarker[]
  zoom?: number
  className?: string
}) {
  const router = useRouter()
  const [loadError, setLoadError] = React.useState<{
    apiKey: string
    mapId: string
    message: string
  } | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
  const initialCenter = markers[0]
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : { lat: 35.681236, lng: 139.767125 }
  const activeLoadError =
    loadError && loadError.apiKey === apiKey && loadError.mapId === mapId
      ? loadError.message
      : null

  const displayError =
    markers.length > 0 && !apiKey
      ? "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in .env.local - restart the dev server after adding it."
      : markers.length > 0 && !mapId
        ? "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID is not set in .env.local - create a Google Maps web Map ID and restart the dev server."
        : activeLoadError

  if (displayError) {
    return (
      <div
        className={cn(
          "flex h-80 w-full items-center justify-center border bg-muted px-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Map could not load: {displayError}
      </div>
    )
  }

  if (!apiKey || !mapId) {
    return <div className={cn("h-80 w-full border bg-muted", className)} />
  }

  return (
    <div className={cn("h-80 w-full border bg-muted", className)}>
      <APIProvider
        apiKey={apiKey}
        libraries={["marker"]}
        onError={(loadError) => {
          setLoadError({
            apiKey,
            mapId,
            message:
              loadError instanceof Error
                ? loadError.message
                : "Failed to load Google Maps JavaScript API.",
          })
        }}
      >
        <Map
          mapId={mapId}
          className="size-full"
          defaultCenter={initialCenter}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <GoogleMapCamera markers={markers} zoom={zoom} />
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.shopId}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.name}
              anchorPoint={["7px", "7px"]}
              onClick={
                markers.length > 1
                  ? () => router.push(`/shops/${marker.shopId}`)
                  : undefined
              }
            >
              <GoogleShopMarker name={marker.name} />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}
