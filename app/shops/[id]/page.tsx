"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { NaverMap } from "@/components/naver-map"
import { OwnerOnly } from "@/components/owner-only"
import { PhotoGrid } from "@/components/photo-grid"
import { Button } from "@/components/ui/button"
import { getSampleShop, usingSampleData } from "@/lib/sample-data"

export default function ShopDetailPage() {
  const params = useParams<{ id: string }>()
  const showSamples = usingSampleData()
  const realData = useQuery(
    api.shops.get,
    showSamples ? "skip" : { id: params.id as Id<"shops"> }
  )
  const data = showSamples ? getSampleShop(params.id) : realData

  if (data === undefined) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        Loading shop
      </main>
    )
  }

  if (!data) {
    return <main className="mx-auto max-w-6xl px-4 py-6">Shop not found.</main>
  }

  const { shop, visits } = data

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl">{shop.name}</h1>
          {shop.nameJa ? (
            <p className="text-sm text-muted-foreground">{shop.nameJa}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {shop.area}, {shop.city}, {shop.country}
          </p>
          {shop.addressLine ? (
            <p className="text-sm text-muted-foreground">{shop.addressLine}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {shop.googleMapsUrl ? (
            <Button asChild variant="outline">
              <Link href={shop.googleMapsUrl} target="_blank">
                Maps
              </Link>
            </Button>
          ) : null}
          {shop.tabelogUrl ? (
            <Button asChild variant="outline">
              <Link href={shop.tabelogUrl} target="_blank">
                Tabelog
              </Link>
            </Button>
          ) : null}
          {showSamples ? null : (
            <OwnerOnly>
              <Button asChild variant="outline">
                <Link href={`/shops/${shop._id}/edit`}>Edit</Link>
              </Button>
            </OwnerOnly>
          )}
        </div>
      </div>
      {shop.country === "KR" &&
      "lat" in shop &&
      "lng" in shop &&
      shop.lat != null &&
      shop.lng != null ? (
        <NaverMap
          markers={[
            {
              shopId: shop._id as Id<"shops">,
              name: shop.name,
              nameJa: shop.nameJa,
              lat: shop.lat,
              lng: shop.lng,
            },
          ]}
          zoom={16}
        />
      ) : null}
      <PhotoGrid visits={visits} />
    </main>
  )
}
