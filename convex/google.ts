import { v } from "convex/values"

import { action } from "./_generated/server"

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

export type GoogleGeocodeResult = {
  lat: number
  lng: number
  matchedAddress: string
  placeId?: string
} | null

type GoogleGeocodeResponse = {
  status?: string
  error_message?: string
  results?: Array<{
    formatted_address?: string
    place_id?: string
    geometry?: {
      location?: {
        lat?: number
        lng?: number
      }
    }
  }>
}

async function geocode(address: string): Promise<GoogleGeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY

  if (!apiKey) {
    throw new Error(
      "GOOGLE_MAPS_GEOCODING_API_KEY is not set in Convex env. Run: bunx convex env set GOOGLE_MAPS_GEOCODING_API_KEY <key>"
    )
  }

  const url = new URL(GEOCODE_URL)
  url.searchParams.set("address", address)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("region", "jp")
  url.searchParams.set("components", "country:JP")
  url.searchParams.set("language", "ja")

  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Google geocoding failed (${response.status} ${response.statusText}): ${body}`
    )
  }

  const data = (await response.json()) as GoogleGeocodeResponse

  if (data.status === "ZERO_RESULTS") return null
  if (data.status !== "OK") {
    if (
      data.status === "REQUEST_DENIED" &&
      data.error_message?.includes("referer restrictions")
    ) {
      throw new Error(
        "Google geocoding is using a browser-restricted API key. Set GOOGLE_MAPS_GEOCODING_API_KEY in Convex env to a server key (no HTTP referrer restrictions; IP restriction is recommended) with Geocoding API enabled."
      )
    }
    throw new Error(
      `Google geocoding error: ${data.status ?? "UNKNOWN"}${
        data.error_message ? `: ${data.error_message}` : ""
      }`
    )
  }

  const first = data.results?.[0]
  const lat = first?.geometry?.location?.lat
  const lng = first?.geometry?.location?.lng
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  )
    return null

  const result: Exclude<GoogleGeocodeResult, null> = {
    lat,
    lng,
    matchedAddress: first?.formatted_address ?? "",
  }
  if (first?.place_id) result.placeId = first.place_id

  return result
}

export const geocodeAddress = action({
  args: { address: v.string(), country: v.optional(v.literal("JP")) },
  handler: async (_ctx, args): Promise<GoogleGeocodeResult> => {
    const trimmed = args.address.trim()
    if (!trimmed) return null
    return geocode(trimmed)
  },
})
