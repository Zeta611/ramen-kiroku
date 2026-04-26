"use client"

import { useConvexAuth } from "convex/react"
import type * as React from "react"

export function ConvexAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="border p-4 text-sm text-muted-foreground">
        Connecting to Convex...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="border p-4 text-sm text-destructive">
        Clerk is signed in, but Convex has not accepted the Clerk token yet.
        Check that the Clerk Convex JWT template is named convex, then restart
        convex dev.
      </div>
    )
  }

  return <>{children}</>
}
