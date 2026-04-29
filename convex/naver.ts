import { v } from "convex/values"

import { internal } from "./_generated/api"
import { action, internalAction } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

// New host (post-2024 NCP Maps migration). The legacy `naveropenapi.apigw.ntruss.com`
// returns 401 errorCode 210 for Applications registered after the migration.
const GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"

export type GeocodeResult = {
  lat: number
  lng: number
  matchedAddress: string
} | null

type NaverGeocodeResponse = {
  status?: string
  errorMessage?: string
  addresses?: Array<{
    x?: string
    y?: string
    roadAddress?: string
    jibunAddress?: string
  }>
}

async function geocode(address: string): Promise<GeocodeResult> {
  const clientId = process.env.NCP_MAP_CLIENT_ID
  const clientSecret = process.env.NCP_MAP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      "NCP_MAP_CLIENT_ID / NCP_MAP_CLIENT_SECRET are not set in Convex env. " +
        "Run: npx convex env set NCP_MAP_CLIENT_ID <id> && " +
        "npx convex env set NCP_MAP_CLIENT_SECRET <secret>"
    )
  }

  const url = `${GEOCODE_URL}?query=${encodeURIComponent(address)}`
  const response = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    // Surface the most common cause when we see 210/Permission Denied: the
    // Geocoding service isn't enabled on the Maps Application yet.
    if (response.status === 401 && body.includes('"errorCode":"210"')) {
      throw new Error(
        "Naver geocoding 'Permission Denied' (210). Enable the Geocoding API on " +
          "your Maps Application: NCP Console → AI·Application Service → Maps → " +
          "Application Registration → [your app] → Edit → check 'Geocoding' under " +
          "Service. Allow a minute for it to propagate, then retry."
      )
    }
    throw new Error(
      `Naver geocoding failed (${response.status} ${response.statusText}): ${body}`
    )
  }

  const data = (await response.json()) as NaverGeocodeResponse

  if (data.status && data.status !== "OK") {
    throw new Error(
      `Naver geocoding error: ${data.errorMessage ?? data.status}`
    )
  }

  const first = data.addresses?.[0]
  if (!first?.x || !first?.y) return null

  // Naver returns x = longitude, y = latitude as strings.
  const lng = Number(first.x)
  const lat = Number(first.y)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    lat,
    lng,
    matchedAddress: first.roadAddress || first.jibunAddress || "",
  }
}

export const geocodeAddress = action({
  args: { address: v.string() },
  handler: async (_ctx, args): Promise<GeocodeResult> => {
    const trimmed = args.address.trim()
    if (!trimmed) return null
    return geocode(trimmed)
  },
})

type BackfillTarget = {
  _id: Id<"shops">
  name: string
  area: string
  city: string
  addressLine: string
}

type BackfillSummary = {
  succeeded: number
  failed: number
  skipped: number
  total: number
}

export const backfillCoordinates = internalAction({
  args: {},
  handler: async (ctx): Promise<BackfillSummary> => {
    const targets: BackfillTarget[] = await ctx.runQuery(
      internal.shops.listMissingCoordinates,
      { country: "KR" }
    )

    const summary: BackfillSummary = {
      succeeded: 0,
      failed: 0,
      skipped: 0,
      total: targets.length,
    }

    for (const shop of targets) {
      try {
        const result = await geocode(shop.addressLine)
        if (!result) {
          summary.skipped += 1
          console.warn(
            `[backfillCoordinates] no result for ${shop.name} (${shop.addressLine})`
          )
        } else {
          await ctx.runMutation(internal.shops.setCoordinates, {
            id: shop._id,
            lat: result.lat,
            lng: result.lng,
          })
          summary.succeeded += 1
          console.log(
            `[backfillCoordinates] ${shop.name}: ${result.lat}, ${result.lng} (${result.matchedAddress})`
          )
        }
      } catch (error) {
        summary.failed += 1
        console.error(
          `[backfillCoordinates] failed for ${shop.name}:`,
          error instanceof Error ? error.message : error
        )
      }

      // Be polite to Naver's rate limits.
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    console.log("[backfillCoordinates] summary:", summary)
    return summary
  },
})
