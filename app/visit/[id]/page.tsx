"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PhotoCarousel } from "@/components/photo-carousel"
import { StarRatingDisplay } from "@/components/star-rating"
import { StyleChip } from "@/components/style-chip"
import { TranslatedComment } from "@/components/translated-comment"
import { VisitActions } from "@/components/visit-actions"
import { noodleFirmnessLabel, noodleThicknessLabel } from "@/lib/ramen"
import {
  getSampleVisit,
  SAMPLE_SHOPS,
  usingSampleData,
} from "@/lib/sample-data"

export default function VisitDetailPage() {
  const params = useParams<{ id: string }>()
  const showSamples = usingSampleData()
  const realData = useQuery(
    api.visits.get,
    showSamples ? "skip" : { id: params.id as Id<"visits"> }
  )
  const sampleVisit = showSamples ? getSampleVisit(params.id) : null
  const data =
    showSamples && sampleVisit
      ? {
          visit: sampleVisit,
          shop:
            SAMPLE_SHOPS.find((shop) => shop._id === sampleVisit.shopId) ??
            null,
          photos: sampleVisit.photos,
        }
      : realData

  if (data === undefined) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        Loading visit
      </main>
    )
  }

  if (!data) {
    return <main className="mx-auto max-w-5xl px-4 py-6">Visit not found.</main>
  }

  const { visit, shop, photos } = data

  const noodleParts = [
    visit.noodleThickness ? noodleThicknessLabel(visit.noodleThickness) : null,
    visit.noodleFirmness ? noodleFirmnessLabel(visit.noodleFirmness) : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <StyleChip style={visit.style} />
          <h1 className="font-heading text-4xl">{visit.bowlName}</h1>
          <div className="text-sm text-muted-foreground">
            {shop ? (
              <Link
                href={`/shops/${shop._id}`}
                className="underline underline-offset-4"
              >
                {shop.name}
              </Link>
            ) : (
              visit.shopName
            )}{" "}
            · {visit.area}, {visit.city} · {visit.visitedOn}
          </div>
        </div>
        {showSamples ? null : (
          <VisitActions visitId={visit._id as Id<"visits">} />
        )}
      </div>

      {photos.length > 0 ? (
        <PhotoCarousel photos={photos} title={visit.bowlName} />
      ) : (
        <div className="grid aspect-square place-items-center border border-dashed text-sm text-muted-foreground">
          No photos
        </div>
      )}

      <section className="grid gap-4 border p-4 sm:grid-cols-[1fr_2fr]">
        <div className="grid content-start gap-3">
          <StarRatingDisplay value={visit.ratingOverall} />
          <div className="grid gap-1 text-sm">
            <p>Broth: {visit.ratingBroth ?? "n/a"}</p>
            <p>Noodles: {visit.ratingNoodles ?? "n/a"}</p>
            <p>Toppings: {visit.ratingToppings ?? "n/a"}</p>
            <p>{visit.wouldRevisit ? "Would revisit" : "Would not revisit"}</p>
          </div>
          {visit.pricePaid ? (
            <p className="font-mono text-sm">
              {visit.pricePaid.toLocaleString()} {visit.priceCurrency}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4">
          {noodleParts.length > 0 ? (
            <div>
              <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Noodles
              </h2>
              <p className="text-sm">{noodleParts.join(" · ")}</p>
            </div>
          ) : null}
          {visit.toppings.length > 0 ? (
            <div>
              <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Toppings
              </h2>
              <p className="text-sm">{visit.toppings.join(", ")}</p>
            </div>
          ) : null}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Notes
              </h2>
              {visit.comment.trim() ? <LanguageSwitcher size="xs" /> : null}
            </div>
            <TranslatedComment
              ko={visit.comment}
              en={visit.commentEn}
              es={visit.commentEs}
              status={visit.commentTranslationStatus}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
