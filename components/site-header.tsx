"use client"

import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { RiAddLine, RiStore2Line, RiUserLine } from "@remixicon/react"
import Link from "next/link"
import Image from "next/image"

import { OwnerOnly } from "@/components/owner-only"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3">
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
        <nav className="flex items-center gap-0.5">
          <Button asChild variant="ghost" size="sm">
            <Link href="/shops">
              <RiStore2Line />
              <span className="hidden sm:block">Shops</span>
            </Link>
          </Button>
          <span className="flex items-center gap-3">
            <OwnerOnly>
              <Button asChild size="sm">
                <Link href="/new">
                  <RiAddLine />
                  New
                </Link>
              </Button>
            </OwnerOnly>
            {isLoaded && isSignedIn ? <UserButton /> : null}
          </span>
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
    <SignInButton mode="modal">
      <Button variant="ghost" size="sm">
        <RiUserLine />
        <span className="hidden sm:block">Sign in</span>
      </Button>
    </SignInButton>
  )
}
