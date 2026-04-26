"use client"

import { useQuery } from "convex/react"
import { useParams } from "next/navigation"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ConvexAuthGate } from "@/components/convex-auth-gate"
import { ShopForm } from "@/components/shop-form"

export const dynamic = "force-dynamic"

export default function EditShopPage() {
  const params = useParams<{ id: string }>()
  const data = useQuery(api.shops.get, { id: params.id as Id<"shops"> })

  if (data === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">
        Loading shop
      </main>
    )
  }

  if (!data) {
    return <main className="mx-auto max-w-4xl px-4 py-6">Shop not found.</main>
  }

  const { shop } = data

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-4xl">Edit shop</h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
      </div>
      <ConvexAuthGate>
        <ShopForm
          id={shop._id}
          initial={{
            name: shop.name,
            nameJa: shop.nameJa,
            country: shop.country,
            city: shop.city,
            area: shop.area,
            addressLine: shop.addressLine,
            lat: shop.lat,
            lng: shop.lng,
            googleMapsUrl: shop.googleMapsUrl,
            tabelogUrl: shop.tabelogUrl,
          }}
        />
      </ConvexAuthGate>
    </main>
  )
}
