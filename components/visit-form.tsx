"use client"

import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { PhotoManager, type ManagedPhoto } from "@/components/photo-manager"
import { PhotoUploader, type UploadedPhoto } from "@/components/photo-uploader"
import { RatingInput } from "@/components/star-rating"
import { ShopPicker, type ShopFormValue } from "@/components/shop-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  NOODLE_FIRMNESS_OPTIONS,
  NOODLE_THICKNESS_OPTIONS,
  RAMEN_STYLES,
  STYLE_LABELS,
  type RamenStyle,
} from "@/lib/ramen"

type VisitFields = {
  visitedOn: string
  bowlName: string
  style: RamenStyle
  pricePaid?: number
  priceCurrency?: "JPY" | "KRW"
  noodleFirmness?: string
  noodleThickness?: string
  toppings: string
  ratingOverall: number
  ratingBroth?: number
  ratingNoodles?: number
  ratingToppings?: number
  wouldRevisit: boolean
  comment: string
}

type InitialVisit = {
  id: Id<"visits">
  shop: ShopFormValue
  visit: VisitFields
  photos: ManagedPhoto[]
}

const TOPPING_OPTIONS = [
  "ajitama",
  "chashu",
  "nori",
  "menma",
  "negi",
  "kikurage",
  "corn",
  "butter",
  "bean sprouts",
  "garlic",
  "spicy miso",
] as const

const defaultShop: ShopFormValue = {
  name: "",
  country: "KR",
  city: "Seoul",
  area: "Hongdae",
}

function createDefaultVisit(visitedOn: string): VisitFields {
  return {
    visitedOn,
    bowlName: "",
    style: "tonkotsu",
    toppings: "",
    ratingOverall: 4,
    wouldRevisit: true,
    comment: "",
  }
}

export function VisitForm({
  initial,
  initialVisitedOn,
}: {
  initial?: InitialVisit
  initialVisitedOn?: string
}) {
  const router = useRouter()
  const shops = useQuery(api.shops.list, {}) ?? []
  const createVisit = useMutation(api.visits.createWithPhotos)
  const updateVisit = useMutation(api.visits.update)
  const [shop, setShop] = React.useState<ShopFormValue>(
    initial?.shop ?? defaultShop
  )
  const [visit, setVisit] = React.useState<VisitFields>(
    initial?.visit ?? createDefaultVisit(initialVisitedOn ?? "")
  )
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEdit = Boolean(initial)

  function updateVisitFields(patch: Partial<VisitFields>) {
    setVisit((current) => ({ ...current, ...patch }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      if (!shop.name.trim() || !shop.city.trim() || !shop.area.trim()) {
        throw new Error("Shop name, city, and area are required")
      }
      if (!visit.bowlName.trim()) {
        throw new Error("Bowl name is required")
      }

      const payload = {
        shop: {
          ...shop,
          name: shop.name.trim(),
          city: shop.city.trim(),
          area: shop.area.trim(),
        },
        visit: {
          visitedOn: visit.visitedOn,
          bowlName: visit.bowlName.trim(),
          style: visit.style,
          pricePaid: visit.pricePaid,
          priceCurrency: visit.priceCurrency,
          noodleFirmness: visit.noodleFirmness,
          noodleThickness: visit.noodleThickness,
          toppings: visit.toppings
            .split(",")
            .map((topping) => topping.trim())
            .filter(Boolean),
          ratingOverall: visit.ratingOverall,
          ratingBroth: visit.ratingBroth,
          ratingNoodles: visit.ratingNoodles,
          ratingToppings: visit.ratingToppings,
          wouldRevisit: visit.wouldRevisit,
          comment: visit.comment,
        },
      }

      if (initial) {
        await updateVisit({ id: initial.id, ...payload })
        toast.success("Visit updated")
        router.push(`/visit/${initial.id}`)
      } else {
        const visitId = await createVisit({ ...payload, photos })
        toast.success("Visit created")
        router.push(`/visit/${visitId}`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save visit"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <section className="grid gap-4 border p-4">
        <div>
          <h2 className="font-heading text-2xl">Shop</h2>
          <p className="text-sm text-muted-foreground">
            Pick an existing shop or create a new one inline.
          </p>
        </div>
        <ShopPicker shops={shops} value={shop} onChange={setShop} />
      </section>

      <section className="grid gap-4 border p-4">
        <div>
          <h2 className="font-heading text-2xl">Bowl</h2>
          <p className="text-sm text-muted-foreground">
            Core visit notes and ratings.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Bowl name"
            value={visit.bowlName}
            onChange={(bowlName) => updateVisitFields({ bowlName })}
            required
          />
          <Field
            label="Visited on"
            type="date"
            value={visit.visitedOn}
            onChange={(visitedOn) => updateVisitFields({ visitedOn })}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Style
            </label>
            <Select
              value={visit.style}
              onValueChange={(style) =>
                updateVisitFields({ style: style as RamenStyle })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RAMEN_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {STYLE_LABELS[style]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Field
            label="Price"
            type="number"
            value={visit.pricePaid?.toString() ?? ""}
            onChange={(pricePaid) =>
              updateVisitFields({
                pricePaid: pricePaid ? Number(pricePaid) : undefined,
              })
            }
          />
          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Currency
            </label>
            <Select
              value={visit.priceCurrency ?? "none"}
              onValueChange={(priceCurrency) =>
                updateVisitFields({
                  priceCurrency:
                    priceCurrency === "none"
                      ? undefined
                      : (priceCurrency as "JPY" | "KRW"),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">No price</SelectItem>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <OptionalSelectField
            label="Noodle firmness"
            value={visit.noodleFirmness ?? ""}
            options={NOODLE_FIRMNESS_OPTIONS}
            emptyLabel="Choose firmness"
            onChange={(noodleFirmness) => updateVisitFields({ noodleFirmness })}
          />
          <OptionalSelectField
            label="Noodle thickness"
            value={visit.noodleThickness ?? ""}
            options={NOODLE_THICKNESS_OPTIONS}
            emptyLabel="Choose thickness"
            onChange={(noodleThickness) =>
              updateVisitFields({ noodleThickness })
            }
          />
          <ToppingsField
            value={visit.toppings}
            onChange={(toppings) => updateVisitFields({ toppings })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RatingInput
            label="Overall"
            value={visit.ratingOverall}
            onChange={(ratingOverall) => updateVisitFields({ ratingOverall })}
          />
          <OptionalRating
            label="Broth"
            value={visit.ratingBroth}
            onChange={(ratingBroth) => updateVisitFields({ ratingBroth })}
          />
          <OptionalRating
            label="Noodles"
            value={visit.ratingNoodles}
            onChange={(ratingNoodles) => updateVisitFields({ ratingNoodles })}
          />
          <OptionalRating
            label="Toppings"
            value={visit.ratingToppings}
            onChange={(ratingToppings) => updateVisitFields({ ratingToppings })}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Revisit
          </label>
          <Select
            value={visit.wouldRevisit ? "yes" : "no"}
            onValueChange={(value) =>
              updateVisitFields({ wouldRevisit: value === "yes" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="yes">Would revisit</SelectItem>
                <SelectItem value="no">Would not revisit</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Comment
          </label>
          <Textarea
            value={visit.comment}
            rows={8}
            onChange={(event) =>
              updateVisitFields({ comment: event.target.value })
            }
          />
        </div>
      </section>

      {initial ? (
        <PhotoManager visitId={initial.id} initialPhotos={initial.photos} />
      ) : (
        <section className="border p-4">
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </section>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : isEdit ? "Save changes" : "Create visit"}
        </Button>
      </div>
    </form>
  )
}

function OptionalSelectField({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  emptyLabel: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <div className="grid content-start gap-2">
      <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </label>
      <Select
        value={value || "none"}
        onValueChange={(nextValue) =>
          onChange(nextValue === "none" ? undefined : nextValue)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">{emptyLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function ToppingsField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const selectedToppings = splitToppings(value)

  return (
    <div className="grid content-start gap-2">
      <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Toppings
      </label>
      <div className="flex flex-wrap gap-1.5">
        {TOPPING_OPTIONS.map((topping) => {
          const isSelected = selectedToppings.includes(topping)

          return (
            <Button
              key={topping}
              type="button"
              size="xs"
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              onClick={() => onChange(toggleTopping(value, topping))}
            >
              {topping}
            </Button>
          )
        })}
      </div>
      <Input
        value={value}
        placeholder="custom toppings"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function splitToppings(value: string) {
  return value
    .split(",")
    .map((topping) => topping.trim())
    .filter(Boolean)
}

function toggleTopping(value: string, topping: string) {
  const toppings = splitToppings(value)
  const nextToppings = toppings.includes(topping)
    ? toppings.filter((currentTopping) => currentTopping !== topping)
    : [...toppings, topping]

  return nextToppings.join(", ")
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function OptionalRating({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (value: number | undefined) => void
}) {
  return (
    <div className="grid gap-2">
      <RatingInput label={label} value={value ?? 3} onChange={onChange} />
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => onChange(undefined)}
      >
        Clear {label.toLowerCase()}
      </Button>
    </div>
  )
}
