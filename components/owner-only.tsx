"use client"

import { useUser } from "@clerk/nextjs"
import type * as React from "react"

export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser()

  if (!isLoaded) return null

  const email = user?.primaryEmailAddress?.emailAddress
  if (email !== process.env.NEXT_PUBLIC_OWNER_EMAIL) return null

  return <>{children}</>
}
