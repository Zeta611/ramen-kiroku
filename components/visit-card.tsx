import Image from "next/image"
import Link from "next/link"

import { StarRatingDisplay } from "@/components/star-rating"
import { StyleChip } from "@/components/style-chip"
import type { RamenStyle } from "@/lib/ramen"

type VisitCardProps = {
  visit: {
    _id: string
    bowlName: string
    shopName: string
    city: string
    area: string
    visitedOn: string
    style: RamenStyle
    ratingOverall: number
    firstPhoto?: { thumbUrl: string; width: number; height: number } | null
  }
}

export function VisitCard({ visit }: VisitCardProps) {
  return (
    <Link
      href={`/visit/${visit._id}`}
      className="group block overflow-hidden border bg-card"
    >
      <div className="relative aspect-square bg-muted">
        {visit.firstPhoto ? (
          <Image
            src={visit.firstPhoto.thumbUrl}
            alt={`${visit.bowlName} at ${visit.shopName}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs tracking-widest text-muted-foreground uppercase">
            No photo
          </div>
        )}
      </div>
      <div className="grid gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{visit.bowlName}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {visit.shopName} · {visit.area}
            </p>
          </div>
          <StyleChip style={visit.style} />
        </div>
        <div className="flex flex-col gap-0.5">
          <StarRatingDisplay value={visit.ratingOverall} />
          <time
            className="font-mono text-xs text-muted-foreground"
            dateTime={visit.visitedOn}
          >
            {visit.visitedOn}
          </time>
        </div>
      </div>
    </Link>
  )
}
