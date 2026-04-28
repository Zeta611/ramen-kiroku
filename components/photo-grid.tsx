import { VisitCard } from "@/components/visit-card"
import type { RamenStyle } from "@/lib/ramen"

type Visit = {
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

export function PhotoGrid({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <div className="flex min-h-[45svh] items-center justify-center border border-dashed p-8 text-center">
        <div className="grid max-w-sm gap-2">
          <h2 className="font-heading text-2xl">No bowls logged yet</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visits.map((visit) => (
        <VisitCard key={visit._id} visit={visit} />
      ))}
    </div>
  )
}
