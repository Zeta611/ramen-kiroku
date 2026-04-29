"use client"

import { useAction, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COUNTRIES, type CountryCode } from "@/lib/ramen"

export type ShopFormFields = {
  name: string
  nameJa?: string
  country: CountryCode
  city: string
  area: string
  addressLine?: string
  lat?: number
  lng?: number
  googleMapsUrl?: string
  tabelogUrl?: string
}

export function ShopForm({
  id,
  initial,
}: {
  id: Id<"shops">
  initial: ShopFormFields
}) {
  const router = useRouter()
  const updateShop = useMutation(api.shops.update)
  const geocodeAddress = useAction(api.naver.geocodeAddress)
  const [shop, setShop] = React.useState<ShopFormFields>(initial)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGeocoding, setIsGeocoding] = React.useState(false)

  function update(patch: Partial<ShopFormFields>) {
    setShop((current) => ({ ...current, ...patch }))
  }

  async function onGeocode() {
    const address = shop.addressLine?.trim()
    if (!address) {
      toast.error("Add an address first")
      return
    }
    if (shop.country !== "KR") {
      toast.error("Naver geocoding only supports Korean addresses")
      return
    }

    setIsGeocoding(true)
    try {
      const result = await geocodeAddress({ address })
      if (!result) {
        toast.error("Naver returned no match for that address")
        return
      }
      update({ lat: result.lat, lng: result.lng })
      toast.success(
        result.matchedAddress
          ? `Matched: ${result.matchedAddress}`
          : "Coordinates filled from Naver"
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Geocoding failed"
      toast.error(message)
    } finally {
      setIsGeocoding(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      if (!shop.name.trim() || !shop.city.trim() || !shop.area.trim()) {
        throw new Error("Shop name, city, and area are required")
      }

      await updateShop({
        id,
        name: shop.name.trim(),
        nameJa: shop.nameJa?.trim() || undefined,
        country: shop.country,
        city: shop.city.trim(),
        area: shop.area.trim(),
        addressLine: shop.addressLine?.trim() || undefined,
        lat: shop.lat,
        lng: shop.lng,
        googleMapsUrl: shop.googleMapsUrl?.trim() || undefined,
        tabelogUrl: shop.tabelogUrl?.trim() || undefined,
      })

      toast.success("Shop updated")
      router.push(`/shops/${id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save shop"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <section className="grid gap-4 border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Shop name"
            value={shop.name}
            onChange={(name) => update({ name })}
            required
          />
          <Field
            label="Japanese name"
            value={shop.nameJa ?? ""}
            onChange={(nameJa) => update({ nameJa: nameJa || undefined })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Country
            </label>
            <Select
              value={shop.country}
              onValueChange={(country) =>
                update({ country: country as CountryCode })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field
            label="City"
            value={shop.city}
            onChange={(city) => update({ city })}
            required
          />
          <Field
            label="Area"
            value={shop.area}
            onChange={(area) => update({ area })}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Address
          </label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={shop.addressLine ?? ""}
              onChange={(event) =>
                update({
                  addressLine: event.target.value || undefined,
                })
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={onGeocode}
              disabled={
                isGeocoding ||
                !shop.addressLine?.trim() ||
                shop.country !== "KR"
              }
              title={
                shop.country === "KR"
                  ? "Look up lat/lng from Naver"
                  : "Naver geocoding is KR-only for now"
              }
            >
              {isGeocoding ? "Geocoding…" : "Geocode"}
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Latitude"
            value={shop.lat}
            onChange={(lat) => update({ lat })}
          />
          <NumberField
            label="Longitude"
            value={shop.lng}
            onChange={(lng) => update({ lng })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Google Maps URL"
            value={shop.googleMapsUrl ?? ""}
            onChange={(googleMapsUrl) =>
              update({ googleMapsUrl: googleMapsUrl || undefined })
            }
          />
          <Field
            label="Tabelog URL"
            value={shop.tabelogUrl ?? ""}
            onChange={(tabelogUrl) =>
              update({ tabelogUrl: tabelogUrl || undefined })
            }
          />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </label>
      <Input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </label>
      <Input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === "") {
            onChange(undefined)
            return
          }
          const parsed = Number(raw)
          onChange(Number.isFinite(parsed) ? parsed : undefined)
        }}
      />
    </div>
  )
}
