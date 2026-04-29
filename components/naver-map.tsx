"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export type NaverMapMarker = {
  shopId: Id<"shops">
  name: string
  nameJa?: string
  lat: number
  lng: number
}

// Minimal type stubs for window.naver — the SDK has no first-party @types
// package. We treat the global namespace as opaque and only describe the
// surface we actually use.
type NaverLatLng = { __naverLatLng: never }
type NaverLatLngBounds = {
  extend: (latLng: NaverLatLng) => void
}
type NaverMapInstance = {
  fitBounds: (bounds: NaverLatLngBounds) => void
  destroy?: () => void
}
type NaverMarkerInstance = unknown
type NaverNamespace = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: { center: NaverLatLng; zoom: number }
    ) => NaverMapInstance
    Marker: new (opts: {
      position: NaverLatLng
      map: NaverMapInstance
      title?: string
    }) => NaverMarkerInstance
    LatLng: new (lat: number, lng: number) => NaverLatLng
    LatLngBounds: new () => NaverLatLngBounds
    Event: {
      addListener: (
        target: NaverMarkerInstance,
        type: string,
        handler: () => void
      ) => void
    }
  }
}

declare global {
  interface Window {
    naver?: NaverNamespace
  }
}

let sdkLoadPromise: Promise<NaverNamespace> | null = null

function loadNaverSdk(): Promise<NaverNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Naver Maps SDK can only load in the browser")
    )
  }
  if (window.naver?.maps) return Promise.resolve(window.naver)
  if (sdkLoadPromise) return sdkLoadPromise

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  if (!clientId) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not set in .env.local — restart `npm run dev` after adding it."
      )
    )
  }

  sdkLoadPromise = new Promise<NaverNamespace>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`
    script.async = true
    script.onload = () => {
      if (window.naver?.maps) {
        resolve(window.naver)
      } else {
        sdkLoadPromise = null
        reject(
          new Error(
            "Naver Maps SDK loaded but window.naver.maps is undefined — check the Application's allowed-domain list in NCP Console."
          )
        )
      }
    }
    script.onerror = () => {
      sdkLoadPromise = null
      reject(
        new Error(
          "Failed to load Naver Maps SDK — check that NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is correct and this domain is allowlisted in the NCP Maps Application."
        )
      )
    }
    document.head.appendChild(script)
  })

  return sdkLoadPromise
}

export function NaverMap({
  markers,
  zoom = 15,
  className,
}: {
  markers: NaverMapMarker[]
  zoom?: number
  className?: string
}) {
  const router = useRouter()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || markers.length === 0) return

    let cancelled = false
    let mapInstance: NaverMapInstance | null = null

    loadNaverSdk()
      .then((naver) => {
        if (cancelled || !container) return

        // Reset container so React Strict Mode (which double-invokes effects in
        // dev) and any prior mount don't leave a leftover map node.
        container.innerHTML = ""

        const initialCenter = new naver.maps.LatLng(
          markers[0].lat,
          markers[0].lng
        )
        const map = new naver.maps.Map(container, {
          center: initialCenter,
          zoom,
        })
        mapInstance = map

        const bounds = new naver.maps.LatLngBounds()

        for (const marker of markers) {
          const position = new naver.maps.LatLng(marker.lat, marker.lng)
          const m = new naver.maps.Marker({
            position,
            map,
            title: marker.name,
          })
          bounds.extend(position)

          if (markers.length > 1) {
            naver.maps.Event.addListener(m, "click", () => {
              router.push(`/shops/${marker.shopId}`)
            })
          }
        }

        if (markers.length > 1) {
          map.fitBounds(bounds)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      try {
        mapInstance?.destroy?.()
      } catch {
        // ignore — we'll clear the container regardless
      }
      if (container) container.innerHTML = ""
    }
  }, [markers, zoom, router])

  if (error) {
    return (
      <div
        className={cn(
          "flex h-80 w-full items-center justify-center border bg-muted px-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Map could not load: {error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-80 w-full border bg-muted", className)}
    />
  )
}
