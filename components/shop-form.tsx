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

function prepareShopFields(shop: ShopFormFields) {
  if (!shop.name.trim() || !shop.city.trim() || !shop.area.trim()) {
    throw new Error("Shop name, city, and area are required")
  }

  return {
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
  }
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
  const [shop, setShop] = React.useState<ShopFormFields>(initial)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await updateShop({
        id,
        ...prepareShopFields(shop),
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
      <ShopFieldsForm shop={shop} onChange={setShop} />

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

export function WishlistShopForm({ initial }: { initial: ShopFormFields }) {
  const router = useRouter()
  const addToWishlist = useMutation(api.shops.addToWishlist)
  const [shop, setShop] = React.useState<ShopFormFields>(initial)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await addToWishlist(prepareShopFields(shop))
      toast.success("Place added to wishlist")
      router.push("/wishlist")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add place"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <ShopFieldsForm shop={shop} onChange={setShop} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding" : "Add place"}
        </Button>
      </div>
    </form>
  )
}

function ShopFieldsForm({
  shop,
  onChange,
}: {
  shop: ShopFormFields
  onChange: React.Dispatch<React.SetStateAction<ShopFormFields>>
}) {
  const geocodeKoreanAddress = useAction(api.naver.geocodeAddress)
  const geocodeJapaneseAddress = useAction(api.google.geocodeAddress)
  const [isGeocoding, setIsGeocoding] = React.useState(false)

  function update(patch: Partial<ShopFormFields>) {
    onChange((current) => ({ ...current, ...patch }))
  }

  async function onGeocode() {
    const address = shop.addressLine?.trim()
    if (!address) {
      toast.error("Add an address first")
      return
    }

    setIsGeocoding(true)
    try {
      const provider = shop.country === "JP" ? "Google" : "Naver"
      const result =
        shop.country === "JP"
          ? await geocodeJapaneseAddress({ address, country: "JP" })
          : await geocodeKoreanAddress({ address })
      if (!result) {
        toast.error(`${provider} returned no match for that address`)
        return
      }
      update({ lat: result.lat, lng: result.lng })
      toast.success(
        result.matchedAddress
          ? `Matched: ${result.matchedAddress}`
          : `Coordinates filled from ${provider}`
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Geocoding failed"
      toast.error(message)
    } finally {
      setIsGeocoding(false)
    }
  }

  return (
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
            disabled={isGeocoding || !shop.addressLine?.trim()}
            title={
              shop.country === "KR"
                ? "Look up lat/lng from Naver"
                : "Look up lat/lng from Google"
            }
          >
            {isGeocoding ? "Geocoding..." : "Geocode"}
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
