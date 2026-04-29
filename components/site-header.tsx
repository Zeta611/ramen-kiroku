"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { RiAddLine, RiBookmarkLine, RiMap2Line } from "@remixicon/react"
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
            <Link href="/map">
              <RiMap2Line data-icon="inline-start" />
              <span className="hidden sm:block">Map</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/wishlist">
              <RiBookmarkLine data-icon="inline-start" />
              <span className="hidden sm:block">Wishlist</span>
            </Link>
          </Button>
          <span className="flex items-center gap-3">
            <OwnerOnly>
              <Button asChild size="sm">
                <Link href="/new">
                  <RiAddLine data-icon="inline-start" />
                  New
                </Link>
              </Button>
            </OwnerOnly>
            {isLoaded && isSignedIn ? <UserButton /> : null}
          </span>
        </nav>
      </div>
    </header>
  )
}
