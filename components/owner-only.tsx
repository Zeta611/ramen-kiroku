"use client"

import { useUser } from "@clerk/nextjs"
import type * as React from "react"

export function useIsOwner() {
  const { isLoaded, user } = useUser()
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL

  return (
    isLoaded &&
    ownerEmail != null &&
    user?.emailAddresses.some(
      (email) => email.emailAddress === ownerEmail
    ) === true
  )
}

export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const isOwner = useIsOwner()
  if (!isOwner) return null

  return <>{children}</>
}
