"use client"

import { useQuery } from "convex/react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { api } from "@/convex/_generated/api"
import { FilterBar, type FeedFilters } from "@/components/filter-bar"
import { SAMPLE_SHOPS, SAMPLE_VISITS, usingSampleData } from "@/lib/sample-data"

export default function ShopsPage() {
  const [filters, setFilters] = React.useState<FeedFilters>({
    sort: "visitedOn_desc",
  })
  const showSamples = usingSampleData()
  const shops = useQuery(
    api.shops.list,
    showSamples
      ? "skip"
      : {
          country: filters.country,
          city: filters.city,
          area: filters.area,
        }
  )
  const displayShops = showSamples
    ? SAMPLE_SHOPS.map((shop) => {
        const visits = SAMPLE_VISITS.filter(
          (visit) => visit.shopId === shop._id
        )
        return {
          ...shop,
          visitCount: visits.length,
          latestPhoto: visits[0]?.firstPhoto ?? null,
        }
      })
    : shops

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
      <FilterBar filters={filters} onChange={setFilters} />
      <div>
        <h1 className="font-heading text-4xl">Shops</h1>
        <p className="text-sm text-muted-foreground">
          Directory of logged ramen shops.
        </p>
      </div>
      {showSamples ? (
        <div className="border border-dashed p-3 text-xs text-muted-foreground">
          Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured.
        </div>
      ) : null}
      {displayShops === undefined ? (
        <div className="border border-dashed p-8 text-sm text-muted-foreground">
          Loading shops
        </div>
      ) : displayShops.length === 0 ? (
        <div className="border border-dashed p-8 text-sm text-muted-foreground">
          No shops match these filters.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayShops.map((shop) => (
            <Link
              key={shop._id}
              href={`/shops/${shop._id}`}
              className="grid grid-cols-[96px_1fr] overflow-hidden border bg-card"
            >
              <div className="relative aspect-square bg-muted">
                {shop.latestPhoto ? (
                  <Image
                    src={shop.latestPhoto.thumbUrl}
                    alt={shop.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="grid content-between gap-3 p-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{shop.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {shop.area}, {shop.city}
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {shop.visitCount} visits
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
