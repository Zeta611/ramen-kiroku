"use client"

import { useQuery } from "convex/react"
import * as React from "react"

import { api } from "@/convex/_generated/api"
import { FilterBar, type FeedFilters } from "@/components/filter-bar"
import { PhotoGrid } from "@/components/photo-grid"
import { SAMPLE_VISITS, usingSampleData } from "@/lib/sample-data"

export default function Page() {
  const [filters, setFilters] = React.useState<FeedFilters>({
    sort: "visitedOn_desc",
  })
  const showSamples = usingSampleData()
  const visits = useQuery(api.visits.list, showSamples ? "skip" : filters)
  const displayVisits = showSamples ? SAMPLE_VISITS : visits

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
      <FilterBar filters={filters} onChange={setFilters} />
      {showSamples ? (
        <div className="border border-dashed p-3 text-xs text-muted-foreground">
          Showing sample data because NEXT_PUBLIC_CONVEX_URL is not configured.
        </div>
      ) : null}
      {displayVisits === undefined ? (
        <div className="grid min-h-[45svh] place-items-center border border-dashed text-sm text-muted-foreground">
          Loading bowls
        </div>
      ) : (
        <PhotoGrid visits={displayVisits} />
      )}
    </main>
  )
}
