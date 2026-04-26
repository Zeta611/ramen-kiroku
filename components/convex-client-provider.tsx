"use client"

import { useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import * as React from "react"

const convexUrl = (
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  "https://missing-convex-url.convex.cloud"
).replace(/\/+$/, "")

const convex = new ConvexReactClient(convexUrl)

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
