"use client"

import { useAction } from "convex/react"
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

export type ShopFormValue = {
  id?: Id<"shops">
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

type ExistingShop = ShopFormValue & {
  _id: Id<"shops">
}

export function ShopPicker({
  shops,
  value,
  onChange,
}: {
  shops: ExistingShop[]
  value: ShopFormValue
  onChange: (value: ShopFormValue) => void
}) {
  const geocodeKoreanAddress = useAction(api.naver.geocodeAddress)
  const geocodeJapaneseAddress = useAction(api.google.geocodeAddress)
  const [isGeocoding, setIsGeocoding] = React.useState(false)
  const update = (patch: Partial<ShopFormValue>) =>
    onChange({ ...value, ...patch })

  async function onGeocode() {
    const address = value.addressLine?.trim()
    if (!address) {
      toast.error("Add an address first")
      return
    }

    setIsGeocoding(true)
    try {
      const provider = value.country === "JP" ? "Google" : "Naver"
      const result =
        value.country === "JP"
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
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Existing shop
        </label>
        <Select
          value={value.id ?? "new"}
          onValueChange={(shopId) => {
            if (shopId === "new") {
              onChange({ ...value, id: undefined })
              return
            }

            const shop = shops.find((candidate) => candidate._id === shopId)
            if (shop) {
              onChange({
                id: shop._id,
                name: shop.name,
                nameJa: shop.nameJa,
                country: shop.country,
                city: shop.city,
                area: shop.area,
                addressLine: shop.addressLine,
                lat: shop.lat,
                lng: shop.lng,
                googleMapsUrl: shop.googleMapsUrl,
                tabelogUrl: shop.tabelogUrl,
              })
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Create new shop</SelectItem>
            {shops.map((shop) => (
              <SelectItem key={shop._id} value={shop._id}>
                {shop.name} · {shop.area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Shop name"
          value={value.name}
          onChange={(name) => update({ name, id: undefined })}
          required
        />
        <Field
          label="Japanese name"
          value={value.nameJa ?? ""}
          onChange={(nameJa) => update({ nameJa: nameJa || undefined })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Country
          </label>
          <Select
            value={value.country}
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
          value={value.city}
          onChange={(city) => update({ city })}
          required
        />
        <Field
          label="Area"
          value={value.area}
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
            value={value.addressLine ?? ""}
            onChange={(event) =>
              update({ addressLine: event.target.value || undefined })
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={onGeocode}
            disabled={isGeocoding || !value.addressLine?.trim()}
            title={
              value.country === "KR"
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
          value={value.lat}
          onChange={(lat) => update({ lat })}
        />
        <NumberField
          label="Longitude"
          value={value.lng}
          onChange={(lng) => update({ lng })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Google Maps URL"
          value={value.googleMapsUrl ?? ""}
          onChange={(googleMapsUrl) =>
            update({ googleMapsUrl: googleMapsUrl || undefined })
          }
        />
        <Field
          label="Tabelog URL"
          value={value.tabelogUrl ?? ""}
          onChange={(tabelogUrl) =>
            update({ tabelogUrl: tabelogUrl || undefined })
          }
        />
      </div>
    </div>
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
