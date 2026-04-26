import { ConvexAuthGate } from "@/components/convex-auth-gate"
import { VisitForm } from "@/components/visit-form"

export const dynamic = "force-dynamic"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewVisitPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-4xl">New visit</h1>
        <p className="text-sm text-muted-foreground">
          Log a ramen bowl with compressed photo uploads.
        </p>
      </div>
      <ConvexAuthGate>
        <VisitForm initialVisitedOn={today()} />
      </ConvexAuthGate>
    </main>
  )
}
