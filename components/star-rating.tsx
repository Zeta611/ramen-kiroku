"use client"

import { RiStarFill, RiStarLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StarRatingDisplay({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <div
      className={cn("flex items-center gap-1 text-primary", className)}
      aria-label={`${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) =>
        index < value ? (
          <RiStarFill key={index} className="size-4" />
        ) : (
          <RiStarLine key={index} className="size-4" />
        )
      )}
      <span className="ml-1 font-mono text-xs text-muted-foreground">
        {value}
      </span>
    </div>
  )
}

export function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </label>
        <span className="font-mono text-xs">{value}/5</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1
          return (
            <Button
              key={rating}
              type="button"
              variant={rating <= value ? "default" : "outline"}
              size="icon-xs"
              aria-label={`${label} ${rating} out of 5`}
              onClick={() => onChange(rating)}
            >
              {rating}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
