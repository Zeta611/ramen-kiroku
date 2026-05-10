"use client"

import { RiAddLine } from "@remixicon/react"
import { useQuery } from "convex/react"
import Link from "next/link"
import * as React from "react"

import { OwnerOnly, useIsOwner } from "@/components/owner-only"
import { PlaceFilterBar } from "@/components/place-filter-bar"
import {
  ShopMapBrowser,
  type MapBrowserShop,
} from "@/components/shop-map-browser"
import { Button } from "@/components/ui/button"
import { WishlistShopAction } from "@/components/wishlist-shop-action"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { SAMPLE_WISHLIST_SHOPS, usingSampleData } from "@/lib/sample-data"
import type { PlaceFilters } from "@/lib/ramen"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type WishlistShop = {
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

function searchTerms(value: string | undefined) {
  const normalized = value?.trim().toLocaleLowerCase()
  return normalized ? normalized.split(/\s+/).filter(Boolean) : []
}

function matchesSearchText(parts: Array<string | undefined>, terms: string[]) {
  if (terms.length === 0) return true

  const haystack = parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLocaleLowerCase()

  return terms.every((term) => haystack.includes(term))
}

function filterSampleWishlist(filters: PlaceFilters): MapBrowserShop[] {
  const terms = searchTerms(filters.q)

  return SAMPLE_WISHLIST_SHOPS.filter((shop) => {
    if (filters.country && shop.country !== filters.country) return false
    if (filters.city && shop.city !== filters.city) return false
    if (filters.area && shop.area !== filters.area) return false
    if (
      !matchesSearchText(
        [
          shop.name,
          shop.nameJa,
          shop.country,
          shop.city,
          shop.area,
          shop.addressLine,
        ],
        terms
      )
    )
      return false
    return true
  })
    .map((shop) => ({
      ...shop,
      visitCount: 0,
      latestPhoto: null,
    }))
    .sort((a, b) => {
      if (filters.sort === "created_desc") {
        return (
          (b._creationTime ?? 0) - (a._creationTime ?? 0) ||
          a.name.localeCompare(b.name)
        )
      }
      return a.name.localeCompare(b.name)
    })
}

export default function WishlistPage() {
  const [filters, setFilters] = React.useState<PlaceFilters>({
    country: "JP",
    sort: "name_asc",
  })
  const showSamples = usingSampleData()
  const debouncedQ = useDebouncedValue(filters.q, 200)
  const shops = useQuery(
    api.shops.wishlistBrowse,
    showSamples ? "skip" : { ...filters, q: debouncedQ }
  )
  const realShops = shops as WishlistShop[] | undefined
  const displayShops: MapBrowserShop[] | undefined = showSamples
    ? filterSampleWishlist(filters)
    : realShops
  const selectedCountry = filters.country ?? "JP"
  const isOwner = useIsOwner()

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
      <PlaceFilterBar filters={filters} onChange={setFilters} />
      <ShopMapBrowser
        title="Wishlist"
        shops={displayShops}
        selectedCountry={selectedCountry}
        showSamples={showSamples}
        sampleNotice={
          showSamples
            ? "Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured."
            : undefined
        }
        listTitle="Places"
        loadingLabel="Loading wishlist"
        emptyLabel="No wished shops match these filters."
        mapEmptyLabel="No wished shops match these filters."
        missingCoordinatesLabels={{
          JP: "Matching wished Japan shops do not have coordinates yet. Use Geocode on the shop edit page.",
          KR: "Matching wished Korean shops do not have coordinates yet. Add lat/lng from the shop edit page to place them on the map.",
        }}
        summaryLabel={(shopCount, markerCount, missingCoords) => {
          if (shopCount === undefined) return "Loading wishlist"
          return `${markerCount} shown on map · ${shopCount} wished place${
            shopCount === 1 ? "" : "s"
          }${
            missingCoords > 0 ? ` · ${missingCoords} missing coordinates` : ""
          }`
        }}
        listSummaryLabel={(shopCount) =>
          shopCount === undefined
            ? "Loading wishlist"
            : `${shopCount} matching place${shopCount === 1 ? "" : "s"}`
        }
        titleAction={
          <OwnerOnly>
            <Button asChild className="shrink-0">
              <Link href="/wishlist/new">
                <RiAddLine data-icon="inline-start" />
                Add place
              </Link>
            </Button>
          </OwnerOnly>
        }
        action={(shop) =>
          showSamples || !isOwner ? null : (
            <WishlistShopAction shopId={shop._id} />
          )
        }
      />
    </main>
  )
}
