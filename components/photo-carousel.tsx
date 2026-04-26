"use client"

import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFullscreenLine,
} from "@remixicon/react"
import Image from "next/image"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Photo = {
  _id: string
  url: string
  thumbUrl: string
  width: number
  height: number
}

export function PhotoCarousel({
  photos,
  title,
}: {
  photos: Photo[]
  title: string
}) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const activeIndex =
    photos.length === 0 ? 0 : Math.min(selectedIndex, photos.length - 1)
  const selectedPhoto = photos[activeIndex]
  const hasMany = photos.length > 1

  React.useEffect(() => {
    if (!lightboxOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setSelectedIndex((current) => wrapIndex(current - 1, photos.length))
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setSelectedIndex((current) => wrapIndex(current + 1, photos.length))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [lightboxOpen, photos.length])

  if (!selectedPhoto) return null

  function move(offset: number) {
    setSelectedIndex((current) => wrapIndex(current + offset, photos.length))
  }

  return (
    <section className="grid gap-3">
      <div className="relative h-[min(92vw,720px)] min-h-[320px] overflow-hidden border bg-muted sm:h-[min(72vh,720px)] sm:min-h-[520px]">
        <button
          type="button"
          className="group relative block size-full cursor-zoom-in bg-background"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={selectedPhoto.url}
            alt={`${title} photo ${activeIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain"
          />
          <span className="absolute right-3 bottom-3 inline-flex size-10 items-center justify-center bg-background/90 text-foreground ring-1 ring-border">
            <RiFullscreenLine className="size-4" />
            <span className="sr-only">Open photo full screen</span>
          </span>
        </button>
        {hasMany ? (
          <>
            <CarouselButton
              label="Previous photo"
              className="left-5"
              onClick={() => move(-1)}
            >
              <RiArrowLeftSLine />
            </CarouselButton>
            <CarouselButton
              label="Next photo"
              className="right-5"
              onClick={() => move(1)}
            >
              <RiArrowRightSLine />
            </CarouselButton>
          </>
        ) : null}
      </div>

      <div className="grid justify-items-center gap-3 text-xs text-muted-foreground">
        <span className="font-mono">
          {activeIndex + 1} / {photos.length}
        </span>
        {hasMany ? (
          <div className="flex max-w-full justify-center gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={photo._id}
                type="button"
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden border bg-muted",
                  index === activeIndex
                    ? "border-foreground"
                    : "border-border opacity-70 hover:opacity-100"
                )}
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={photo.thumbUrl}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="!top-0 !left-0 h-screen !max-h-screen w-screen !max-w-none !translate-x-0 !translate-y-0 grid-rows-[1fr_auto] gap-0 bg-black p-0 text-white ring-0 sm:!max-w-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{title} photo viewer</DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4 z-20 bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
            >
              <span aria-hidden>x</span>
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <div className="relative grid min-h-0 place-items-center">
            <Image
              src={selectedPhoto.url}
              alt={`${title} photo ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {hasMany ? (
              <>
                <CarouselButton
                  label="Previous photo"
                  className="left-4 bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 sm:left-6"
                  onClick={() => move(-1)}
                >
                  <RiArrowLeftSLine />
                </CarouselButton>
                <CarouselButton
                  label="Next photo"
                  className="right-4 bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 sm:right-6"
                  onClick={() => move(1)}
                >
                  <RiArrowRightSLine />
                </CarouselButton>
              </>
            ) : null}
          </div>
          <div className="pb-5 text-center font-mono text-xs text-white/70">
            {activeIndex + 1} / {photos.length}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function CarouselButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string
  className?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={cn(
        "absolute top-1/2 -translate-y-1/2 bg-background/90",
        className
      )}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function wrapIndex(index: number, length: number) {
  if (length === 0) return 0
  return (index + length) % length
}
