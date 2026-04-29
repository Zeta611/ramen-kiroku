"use client"

import { RiBookmarkLine, RiCloseLine } from "@remixicon/react"
import { useMutation, useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { GoogleMap } from "@/components/google-map"
import { NaverMap } from "@/components/naver-map"
import { OwnerOnly } from "@/components/owner-only"
import { PhotoGrid } from "@/components/photo-grid"
import { Button } from "@/components/ui/button"
import { getSampleShop, usingSampleData } from "@/lib/sample-data"

export default function ShopDetailPage() {
  const params = useParams<{ id: string }>()
  const showSamples = usingSampleData()
  const addToWishlist = useMutation(api.shops.addToWishlist)
  const removeFromWishlist = useMutation(api.shops.removeFromWishlist)
  const [isUpdatingWishlist, setIsUpdatingWishlist] = React.useState(false)
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
  const isWishlisted = "wishlisted" in shop && shop.wishlisted === true
  const marker =
    "lat" in shop && "lng" in shop && shop.lat != null && shop.lng != null
      ? {
          shopId: shop._id as Id<"shops">,
          name: shop.name,
          nameJa: shop.nameJa,
          lat: shop.lat,
          lng: shop.lng,
        }
      : null

  async function onAddToWishlist() {
    if (showSamples) return

    setIsUpdatingWishlist(true)
    try {
      await addToWishlist({
        name: shop.name,
        nameJa: shop.nameJa,
        country: shop.country,
        city: shop.city,
        area: shop.area,
        addressLine: shop.addressLine,
        lat: "lat" in shop ? shop.lat : undefined,
        lng: "lng" in shop ? shop.lng : undefined,
        googleMapsUrl: shop.googleMapsUrl,
        tabelogUrl: shop.tabelogUrl,
      })
      toast.success("Added to wishlist")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add to wishlist"
      toast.error(message)
    } finally {
      setIsUpdatingWishlist(false)
    }
  }

  async function onRemoveFromWishlist() {
    if (showSamples) return

    setIsUpdatingWishlist(true)
    try {
      await removeFromWishlist({ id: shop._id as Id<"shops"> })
      toast.success("Removed from wishlist")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to remove from wishlist"
      toast.error(message)
    } finally {
      setIsUpdatingWishlist(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl">{shop.name}</h1>
            {isWishlisted ? <Badge variant="secondary">Wishlist</Badge> : null}
          </div>
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
              <>
                {isWishlisted ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onRemoveFromWishlist}
                    disabled={isUpdatingWishlist}
                  >
                    <RiCloseLine data-icon="inline-start" />
                    {isUpdatingWishlist ? "Removing" : "Remove from wishlist"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onAddToWishlist}
                    disabled={isUpdatingWishlist}
                  >
                    <RiBookmarkLine data-icon="inline-start" />
                    {isUpdatingWishlist ? "Adding" : "Add to wishlist"}
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/shops/${shop._id}/edit`}>Edit</Link>
                </Button>
              </>
            </OwnerOnly>
          )}
        </div>
      </div>
      {marker && shop.country === "KR" ? (
        <NaverMap markers={[marker]} zoom={16} />
      ) : marker && shop.country === "JP" ? (
        <GoogleMap markers={[marker]} zoom={16} />
      ) : null}
      <PhotoGrid visits={visits} />
    </main>
  )
}
