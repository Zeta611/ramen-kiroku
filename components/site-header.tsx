"use client"

import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { RiAddLine, RiStore2Line } from "@remixicon/react"
import Link from "next/link"
import Image from "next/image"

import { OwnerOnly } from "@/components/owner-only"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="Ramen Kiroku logo"
            width={40}
            height={40}
            className="size-9 object-contain"
          />
          <span className="font-heading text-lg">Ramen Kiroku</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/shops">
              <RiStore2Line />
              Shops
            </Link>
          </Button>
          <OwnerOnly>
            <Button asChild size="sm">
              <Link href="/new">
                <RiAddLine />
                New
              </Link>
            </Button>
          </OwnerOnly>
          {isLoaded && isSignedIn ? <UserButton /> : null}
          <OwnerOnlyFallback
            isLoaded={isLoaded}
            isSignedIn={Boolean(isSignedIn)}
          />
        </nav>
      </div>
    </header>
  )
}

function OwnerOnlyFallback({
  isLoaded,
  isSignedIn,
}: {
  isLoaded: boolean
  isSignedIn: boolean
}) {
  if (!isLoaded || isSignedIn) return null

  return (
    <div className="hidden sm:block">
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </SignInButton>
    </div>
  )
}
