"use client"

import { useQuery } from "convex/react"
import { useParams } from "next/navigation"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { VisitForm } from "@/components/visit-form"

export default function EditVisitPage() {
  const params = useParams<{ id: string }>()
  const data = useQuery(api.visits.get, { id: params.id as Id<"visits"> })

  if (data === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">
        Loading visit
      </main>
    )
  }

  if (!data || !data.shop) {
    return <main className="mx-auto max-w-4xl px-4 py-6">Visit not found.</main>
  }

  const { visit, shop, photos } = data

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-4xl">Edit visit</h1>
        <p className="text-sm text-muted-foreground">{visit.bowlName}</p>
      </div>
      <VisitForm
        initial={{
          id: visit._id,
          shop: {
            id: shop._id,
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
          },
          visit: {
            visitedOn: visit.visitedOn,
            bowlName: visit.bowlName,
            style: visit.style,
            pricePaid: visit.pricePaid,
            priceCurrency: visit.priceCurrency,
            noodleFirmness: visit.noodleFirmness,
            noodleThickness: visit.noodleThickness,
            toppings: visit.toppings.join(", "),
            ratingOverall: visit.ratingOverall,
            ratingBroth: visit.ratingBroth,
            ratingNoodles: visit.ratingNoodles,
            ratingToppings: visit.ratingToppings,
            wouldRevisit: visit.wouldRevisit,
            comment: visit.comment,
          },
          photos,
        }}
      />
    </main>
  )
}
